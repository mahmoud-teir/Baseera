import { isInstallableUpdate, parseUpdateManifest } from '../../src/services/update-manifest';

const manifest = {
  latestVersion: '1.2.0', latestVersionCode: 4,
  apkUrl: 'https://github.com/MohammedTeir/Baseera/releases/download/v1.2.0/baseerah-universal.apk',
};

test('a newer build is offered even when the display version stays the same', () => {
  expect(isInstallableUpdate(parseUpdateManifest(manifest), 3)).toBe(true);
});

test('same or older build cannot trigger an Android downgrade', () => {
  expect(isInstallableUpdate(parseUpdateManifest(manifest), 4)).toBe(false);
  expect(isInstallableUpdate(parseUpdateManifest(manifest), 5)).toBe(false);
});

test.each([
  { ...manifest, apkUrl: 'http://example.com/app.apk' },
  { ...manifest, latestVersionCode: '4' },
  { ...manifest, latestVersionCode: -1 },
  { ...manifest, latestVersion: 'not-a-version' },
  { latestVersion: '1.2.0' },
])('malformed or insecure update metadata is rejected', (value) => {
  expect(() => parseUpdateManifest(value)).toThrow();
});
