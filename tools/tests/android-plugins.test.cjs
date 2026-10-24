const { test } = require('node:test');
const assert = require('node:assert/strict');
const { applyReleaseSigning } = require('../../plugins/withReleaseSigning');
const { applyApkSplits } = require('../../plugins/withApkSplits');

const template = `android {
  signingConfigs { debug { } }
  buildTypes {
    release {
      // see https://reactnative.dev/docs/signed-apk-android.
      signingConfig signingConfigs.debug
    }
  }
}`;

test('release signing replaces the debug fallback and enforces CI credentials', () => {
  const result = applyReleaseSigning(template);
  assert.match(result, /signingConfig project.hasProperty/);
  assert.match(result, /BASEERAH_REQUIRE_RELEASE_SIGNING/);
  assert.equal(applyReleaseSigning(result), result);
});

test('signing fails on an incompatible Gradle template', () => {
  assert.throws(() => applyReleaseSigning('android {}'), /template changed/);
});

test('splits emit a universal APK and all four architectures without versionCode overrides', () => {
  const result = applyApkSplits(template);
  for (const abi of ['arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64']) assert.ok(result.includes(abi));
  assert.match(result, /universalApk true/);
  assert.doesNotMatch(result, /versionCodeOverride/);
  assert.equal(applyApkSplits(result), result);
});
