/**
 * Extra R8/ProGuard keep rules for release builds (minification is on).
 *
 * expo-gl: its GLView is created by reflection (SimpleViewManagerWrapper looks up the constructor),
 * and expo-gl ships no consumer rules, so R8 removed the constructor and opening the 3D Kaaba crashed
 * the app ("Didn't find a correct constructor for class …").
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const MARKER = '# baseerah: extra keep rules';
const RULES = `
${MARKER}
-keep class expo.modules.gl.** { *; }
`;

module.exports = function withExtraProguardRules(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const file = path.join(cfg.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      if (!text.includes(MARKER)) fs.writeFileSync(file, text.trimEnd() + '\n' + RULES);
      return cfg;
    },
  ]);
};
