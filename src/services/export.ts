/** «تصدير بياناتي» — a JSON copy of everything the app stores about the user. */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { INITIAL_STATE, useApp } from '@/state/app-store';

export function exportPayload() {
  const st = useApp.getState();
  const data: Record<string, unknown> = {};
  (Object.keys(INITIAL_STATE) as (keyof typeof INITIAL_STATE)[]).forEach((k) => (data[k] = st[k]));
  return { app: 'baseerah', exportedAt: new Date().toISOString(), data };
}

export async function exportData(): Promise<'downloaded' | 'shared' | 'unavailable'> {
  const json = JSON.stringify(exportPayload(), null, 2);
  const name = `baseerah-data-${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') return 'unavailable';
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'downloaded';
  }
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(json);
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: 'بياناتي في بصيرة' });
  return 'shared';
}

/** Wipe all local data (used by «حذف حسابي وبياناتي» when signed out, and after server deletion). */
export function wipeLocal() {
  useApp.setState({ ...INITIAL_STATE, updatedAt: Date.now() });
}
