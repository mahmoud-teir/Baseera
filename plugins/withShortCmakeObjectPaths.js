/**
 * Windows builds: react-native-gesture-handler's codegen produces object files whose full path is
 * longer than Windows' 260-character limit (ninja: "Filename longer than 260 characters"). Setting
 * CMAKE_OBJECT_PATH_MAX makes CMake replace over-long object names with short hashed names. CMake 3.22
 * shortens only when the target's object directory is shorter than the limit (~170 chars here), so the
 * limit must sit between that and 260.
 * Harmless on macOS/Linux and in EAS builds.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '-DCMAKE_OBJECT_PATH_MAX=';

module.exports = function withShortCmakeObjectPaths(config, { max = 240 } = {}) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy' || cfg.modResults.contents.includes(MARKER)) return cfg;
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /defaultConfig\s*\{/,
      (m) => `${m}\n        externalNativeBuild {\n            cmake {\n                arguments "${MARKER}${max}"\n            }\n        }`,
    );
    return cfg;
  });
};
