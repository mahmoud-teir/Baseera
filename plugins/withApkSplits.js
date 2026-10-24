const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// baseerah: APK architecture splits';
function applyApkSplits(contents) {
  if (contents.includes(MARKER)) return contents;
  if (!/android\s*\{/.test(contents)) throw new Error('Android Gradle template changed: android block missing');
  return contents.replace(/android\s*\{/, (match) => `${match}
    ${MARKER}
    if (findProperty('baseerahApkSplits') == 'true') {
        splits {
            abi {
                enable true
                reset()
                include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
                universalApk true
            }
        }
    }
`);
}

module.exports = function withApkSplits(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') throw new Error('APK splits require Groovy Gradle');
    cfg.modResults.contents = applyApkSplits(cfg.modResults.contents);
    return cfg;
  });
};
module.exports.applyApkSplits = applyApkSplits;
