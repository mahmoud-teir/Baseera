import { Platform } from 'react-native';

import { checkRemoteUpdate, CURRENT_VERSION_CODE } from '../../src/services/updater';

jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.1.1', nativeBuildVersion: '3' }));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: {} }));
jest.mock('expo-intent-launcher', () => ({}));
jest.mock('expo-linking', () => ({}));
jest.mock('expo-sharing', () => ({}));
jest.mock('@/services/supabase', () => ({ supabase: null }));

const originalOS = Platform.OS;
const originalFetch = global.fetch;
const fetchMock = jest.fn();
const release = {
  latestVersion: '1.2.0', latestVersionCode: 4,
  apkUrl: 'https://github.com/MohammedTeir/Baseera/releases/download/v1.2.0/baseerah-universal.apk',
};

beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  global.fetch = fetchMock;
  fetchMock.mockReset();
});
afterAll(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  global.fetch = originalFetch;
});

test('GitHub release discovery offers a newer APK without Supabase', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => release });
  expect(await checkRemoteUpdate()).toMatchObject(release);
  expect(fetchMock.mock.calls[0][0]).toContain('/releases/latest/download/update.json');
});

test('the installed build is not offered again', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ...release, latestVersionCode: CURRENT_VERSION_CODE }) });
  expect(await checkRemoteUpdate()).toBeNull();
});

test('no first release is treated as no update', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 404 });
  expect(await checkRemoteUpdate()).toBeNull();
});

test('offline errors reach the manual-check UI instead of claiming the app is current', async () => {
  fetchMock.mockRejectedValue(new Error('offline'));
  await expect(checkRemoteUpdate()).rejects.toThrow('offline');
});

test('invalid manifest is rejected', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ...release, apkUrl: 'http://example.com/app.apk' }) });
  await expect(checkRemoteUpdate()).rejects.toThrow();
});

test('APK updates are not checked on iOS or web', async () => {
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  expect(await checkRemoteUpdate()).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});
