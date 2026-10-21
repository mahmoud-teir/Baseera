/**
 * Offline downloads (HANDOFF §7 «عدم الاتصال: المحتوى المنزَّل فقط»). Native only — files live in
 * the app's document directory; on the web the browser cache is not under our control, so the
 * UI explains that downloads are available in the mobile app.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { ayahAudioUrl, surah } from '@/data/quran';
import { DOWNLOAD_QUOTA_MB } from '@/data/structural';
import { useApp, type Download } from '@/state/app-store';

import { isOnWifi } from './network';

export const downloadsSupported = Platform.OS !== 'web';

export type DownloadError = 'web' | 'wifi-only' | 'quota' | 'network';
export const DOWNLOAD_ERRORS: Record<DownloadError, string> = {
  web: 'التنزيل للاستماع بلا اتصال متاح في تطبيق الجوال.',
  'wifi-only': 'التنزيل مضبوط على الواي فاي فقط. اتصل بشبكة واي فاي أو غيّر الإعداد.',
  quota: `تجاوزت مساحة التنزيلات (${DOWNLOAD_QUOTA_MB} MB). احذف بعض التنزيلات أولًا.`,
  network: 'تعذّر التنزيل. تحقّق من الاتصال ثم أعد المحاولة.',
};

function usedMb(): number {
  return useApp.getState().downloads.reduce((a, d) => a + d.mb, 0);
}

async function preflight(estimateMb: number): Promise<DownloadError | null> {
  if (!downloadsSupported) return 'web';
  if (useApp.getState().setting('wifi') && !(await isOnWifi())) return 'wifi-only';
  if (usedMb() + estimateMb > DOWNLOAD_QUOTA_MB) return 'quota';
  return null;
}

function surahDir(reciter: string, n: number): Directory {
  return new Directory(Paths.document, 'audio', reciter, String(n));
}

export function surahDownloadId(reciter: string, n: number) {
  return `q:${reciter}:${n}`;
}

export function localAyahUri(reciter: string, s: number, a: number): string | null {
  if (!downloadsSupported) return null;
  if (!useApp.getState().downloads.some((d) => d.id === surahDownloadId(reciter, s))) return null;
  const f = new File(surahDir(reciter, s), `${String(s).padStart(3, '0')}${String(a).padStart(3, '0')}.mp3`);
  return f.exists ? f.uri : null;
}

export async function downloadSurah(reciter: string, n: number, onProgress?: (done: number, total: number) => void): Promise<{ ok: true } | { ok: false; error: DownloadError }> {
  const s = surah(n);
  const pre = await preflight(s.ayas * 0.06);
  if (pre) return { ok: false, error: pre };
  const dir = surahDir(reciter, n);
  try {
    dir.create({ intermediates: true, idempotent: true });
    let bytes = 0;
    for (let a = 1; a <= s.ayas; a++) {
      const name = `${String(n).padStart(3, '0')}${String(a).padStart(3, '0')}.mp3`;
      let f = new File(dir, name);
      if (!f.exists) f = await File.downloadFileAsync(ayahAudioUrl(reciter, n, a), f);
      bytes += f.size;
      onProgress?.(a, s.ayas);
    }
    const d: Omit<Download, 'at'> = { id: surahDownloadId(reciter, n), name: `سورة ${s.name}`, kind: 'سورة', mb: Math.round((bytes / 1e6) * 10) / 10, uri: dir.uri };
    const st = useApp.getState();
    if (!st.downloads.some((x) => x.id === d.id)) st.toggleDownload(d);
    return { ok: true };
  } catch {
    return { ok: false, error: 'network' };
  }
}

/** Generic single-file download (library books / recordings). */
export async function downloadFile(id: string, url: string, name: string, kind: Download['kind'], estimateMb: number): Promise<{ ok: true } | { ok: false; error: DownloadError }> {
  const pre = await preflight(estimateMb);
  if (pre) return { ok: false, error: pre };
  try {
    const dir = new Directory(Paths.document, 'library');
    dir.create({ intermediates: true, idempotent: true });
    const f = await File.downloadFileAsync(url, new File(dir, id.replace(/[^a-z0-9_-]/gi, '_')));
    useApp.getState().toggleDownload({ id, name, kind, mb: Math.round((f.size / 1e6) * 10) / 10, uri: f.uri });
    return { ok: true };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export function deleteDownload(id: string) {
  const d = useApp.getState().downloads.find((x) => x.id === id);
  if (d?.uri && downloadsSupported) {
    try {
      if (d.kind === 'سورة') new Directory(d.uri).delete();
      else new File(d.uri).delete();
    } catch {
      // already gone
    }
  }
  useApp.getState().removeDownload(id);
}
