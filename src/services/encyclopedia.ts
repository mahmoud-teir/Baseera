/**
 * Encyclopedia Service (نظام استدعاء وتخزين موسوعة البداية والنهاية والكتب الكبرى المجزأة).
 * Fetches volume chunks on-demand and caches them in offline cache.
 */
import { File, Paths } from 'expo-file-system';

export interface VolumeMeta {
  volume: number;
  title: string;
  pageCount: number;
  chaptersCount: number;
  sizeKb: number;
  firstChapter: string;
}

export interface EncyclopediaIndex {
  id: string;
  title: string;
  shortTitle: string;
  author: string;
  category: string;
  source: string;
  edition: string;
  totalVolumes: number;
  totalChapters: number;
  totalPages: number;
  volumes: VolumeMeta[];
}

export interface VolumeChapter {
  title: string;
  page: number;
  paragraphs: string[];
}

export interface VolumePayload {
  volume: number;
  title: string;
  pageCount: number;
  chaptersCount: number;
  chapters: VolumeChapter[];
}

const DEFAULT_BASE_URL = 'https://yxqdquynlgfbxyultsux.supabase.co/storage/v1/object/public/apks/encyclopedia/bidayah';

let cachedIndex: EncyclopediaIndex | null = null;
const memoryVolCache = new Map<number, VolumePayload>();

/**
 * Loads the master index of all 20 volumes.
 */
export async function getEncyclopediaIndex(customUrl?: string): Promise<EncyclopediaIndex> {
  if (cachedIndex) return cachedIndex;

  const url = customUrl || `${DEFAULT_BASE_URL}/index.json`;
  const cacheFile = new File(Paths.cache, 'bidayah_index_v2.json');

  // Try local cache first
  try {
    if (cacheFile.exists) {
      const text = await cacheFile.text();
      cachedIndex = JSON.parse(text) as EncyclopediaIndex;
      return cachedIndex;
    }
  } catch {
    // ignore cache read error
  }

  // Fetch from network
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load encyclopedia index: HTTP ${res.status}`);
  }

  const data = (await res.json()) as EncyclopediaIndex;
  cachedIndex = data;

  try {
    await cacheFile.write(JSON.stringify(data));
  } catch {
    // ignore cache write error
  }

  return data;
}

/**
 * Loads a specific volume chunk (1-20).
 */
export async function getVolumeChunk(vol: number, baseUrl?: string): Promise<VolumePayload> {
  if (memoryVolCache.has(vol)) {
    return memoryVolCache.get(vol)!;
  }

  const volStr = String(vol).padStart(2, '0');
  const cacheFile = new File(Paths.cache, `bidayah_vol_v2_${volStr}.json`);

  // Try local file cache
  try {
    if (cacheFile.exists) {
      const text = await cacheFile.text();
      const payload = JSON.parse(text) as VolumePayload;
      memoryVolCache.set(vol, payload);
      return payload;
    }
  } catch {
    // ignore cache read error
  }

  // Fetch remote volume chunk
  const base = baseUrl || DEFAULT_BASE_URL;
  const url = `${base}/vol-${volStr}.json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load volume ${vol}: HTTP ${res.status}`);
  }

  const payload = (await res.json()) as VolumePayload;
  memoryVolCache.set(vol, payload);

  try {
    await cacheFile.write(JSON.stringify(payload));
  } catch {
    // ignore cache write error
  }

  return payload;
}
