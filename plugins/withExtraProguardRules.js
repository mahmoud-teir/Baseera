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

# AndroidX WorkManager & Room Database rules (prevents startup crash in WorkManagerInitializer)
-keep class androidx.work.** { *; }
-dontwarn androidx.work.**
-keep class androidx.room.** { *; }
-dontwarn androidx.room.**
-keep class * extends androidx.room.RoomDatabase { *; }
-keepclassmembers class * extends androidx.room.RoomDatabase {
    <init>();
}
-keep class * extends androidx.work.ListenableWorker {
    <init>(android.content.Context, androidx.work.WorkerParameters);
}
-keep class androidx.work.impl.** { *; }
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
