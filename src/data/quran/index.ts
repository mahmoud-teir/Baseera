/**
 * Quran data — Tanzil Quran Text (Uthmani, v1.1), CC BY 3.0, verbatim (tanzil.net).
 * Metadata is small and bundled; the text ships as the original Tanzil .txt asset (copyright
 * block included) and is parsed once at runtime, so it never inflates the JavaScript bundle.
 * Recitation: per-ayah MP3s from the EveryAyah CDN (folder names verified to exist).
 */
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import meta from './meta.json';

export interface SurahMeta {
  n: number;
  start: number;
  ayas: number;
  order: number;
  name: string;
  type: 'مكية' | 'مدنية';
}

export const SURAHS = meta.sura as SurahMeta[];
export const QURAN_SOURCE = meta.source;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const TEXT_ASSET = require('../../../assets/quran/quran-uthmani.txt');

let text: string[] | null = null;
let copyright = '';
let loading: Promise<string[]> | null = null;

/** Parse Tanzil "sura|aya|text" lines; `#` lines are the copyright block. */
export function parseTanzil(raw: string): { text: string[]; copyright: string } {
  const out: string[] = [];
  const notice: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith('#')) notice.push(line);
    else if (line.trim()) out.push(line.split('|').slice(2).join('|'));
  }
  return { text: out, copyright: notice.join('\n') };
}

export function loadText(): Promise<string[]> {
  if (text) return Promise.resolve(text);
  if (!loading) {
    loading = (async () => {
      const asset = Asset.fromModule(TEXT_ASSET);
      let raw: string;
      if (Platform.OS === 'web') raw = await (await fetch(asset.uri)).text();
      else {
        await asset.downloadAsync();
        raw = await new File(asset.localUri ?? asset.uri).text();
      }
      const parsed = parseTanzil(raw);
      if (parsed.text.length !== 6236) throw new Error('Quran text incomplete');
      text = parsed.text;
      copyright = parsed.copyright;
      return text;
    })().catch((e) => {
      loading = null;
      throw e;
    });
  }
  return loading;
}

export function tanzilCopyright(): string {
  return copyright;
}

export function surah(n: number): SurahMeta {
  return SURAHS[Math.max(1, Math.min(114, n)) - 1];
}

export function ayahsFrom(all: string[], n: number): string[] {
  const s = surah(n);
  return all.slice(s.start, s.start + s.ayas);
}

/** Ayahs of a surah; `null` while the text loads, `error` if it could not be read. */
export function useAyahs(n: number): { ayahs: string[] | null; error: boolean; retry: () => void } {
  const [all, setAll] = useState<string[] | null>(text);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (text) return;
    let alive = true;
    loadText()
      .then((t) => alive && setAll(t))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [attempt]);
  return {
    ayahs: all ? ayahsFrom(all, n) : null,
    error,
    retry: () => {
      setError(false);
      setAttempt((a) => a + 1);
    },
  };
}

export const RECITERS = [
  { id: 'Alafasy_128kbps', name: 'مشاري راشد العفاسي' },
  { id: 'Husary_128kbps', name: 'محمود خليل الحصري' },
  { id: 'Minshawy_Murattal_128kbps', name: 'محمد صديق المنشاوي (مرتّل)' },
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'عبد الباسط عبد الصمد (مرتّل)' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'عبد الرحمن السديس' },
  { id: 'Saood_ash-Shuraym_128kbps', name: 'سعود الشريم' },
  { id: 'MaherAlMuaiqly128kbps', name: 'ماهر المعيقلي' },
  { id: 'Ghamadi_40kbps', name: 'سعد الغامدي' },
] as const;

export function reciterName(id: string): string {
  return RECITERS.find((r) => r.id === id)?.name ?? RECITERS[0].name;
}

const CDN = process.env.EXPO_PUBLIC_RECITATION_CDN ?? 'https://everyayah.com/data';
const pad = (n: number) => String(n).padStart(3, '0');

/** «جودة الصوت: توفير» — lower-bitrate folders that exist on the CDN (verified). */
const LOW: Record<string, string> = {
  Alafasy_128kbps: 'Alafasy_64kbps',
  Husary_128kbps: 'Husary_64kbps',
  Abdul_Basit_Murattal_192kbps: 'Abdul_Basit_Murattal_64kbps',
  'Abdurrahmaan_As-Sudais_192kbps': 'Abdurrahmaan_As-Sudais_64kbps',
  'Saood_ash-Shuraym_128kbps': 'Saood_ash-Shuraym_64kbps',
};

export function reciterFolder(reciter: string, quality: string): string {
  return quality === 'توفير' ? (LOW[reciter] ?? reciter) : reciter;
}

export function ayahAudioUrl(reciter: string, s: number, a: number, quality = 'عالية'): string {
  return `${CDN}/${reciterFolder(reciter, quality)}/${pad(s)}${pad(a)}.mp3`;
}

/** Approximate size of one ayah file for the download quota display (≈ 60 KB at 128 kbps). */
export const AYAH_MB = 0.06;


export * from './pages';
