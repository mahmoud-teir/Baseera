/**
 * Signs local release builds (`./gradlew assembleRelease` / `bundleRelease`) with the project's own
 * upload key instead of the debug key. The keystore and passwords are never in the repository: Gradle
 * reads them from the user-level ~/.gradle/gradle.properties:
 *
 *   BASEERAH_UPLOAD_STORE_FILE=C:/Users/<you>/.baseerah/baseerah-release.jks
 *   BASEERAH_UPLOAD_KEY_ALIAS=baseerah
 *   BASEERAH_UPLOAD_STORE_PASSWORD=…
 *   BASEERAH_UPLOAD_KEY_PASSWORD=…
 *
 * Without those properties (CI, other machines) release builds keep the debug key, as before.
 * EAS Build manages its own credentials and is unaffected.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'BASEERAH_UPLOAD_STORE_FILE';

/** The build.gradle text transform (pure, so it can be checked without running prebuild). */
function applyReleaseSigning(contents) {
  if (contents.includes(MARKER)) return contents;
  let s = contents.replace(
    /signingConfigs\s*\{/,
    (m) => `${m}
        release {
            if (project.hasProperty('${MARKER}')) {
                storeFile file(${MARKER})
                storePassword BASEERAH_UPLOAD_STORE_PASSWORD
                keyAlias BASEERAH_UPLOAD_KEY_ALIAS
                keyPassword BASEERAH_UPLOAD_KEY_PASSWORD
            }
        }`,
  );
  // The release build type: own key when configured, otherwise the template's debug key.
  s = s.replace(
    /(release\s*\{[^{}]*?\/\/ see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\s*)signingConfig signingConfigs\.debug/,
    `$1signingConfig project.hasProperty('${MARKER}') ? signingConfigs.release : signingConfigs.debug`,
  );
  return s;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language === 'groovy') cfg.modResults.contents = applyReleaseSigning(cfg.modResults.contents);
    return cfg;
  });
};
module.exports.applyReleaseSigning = applyReleaseSigning;
