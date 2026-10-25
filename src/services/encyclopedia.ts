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

const cachedIndices = new Map<string, EncyclopediaIndex>();
const memoryVolCache = new Map<string, VolumePayload>();

/**
 * Loads the master index of a chunked book or encyclopedia.
 */
export async function getEncyclopediaIndex(customUrl?: string, bookId = 'bidayah'): Promise<EncyclopediaIndex> {
  const url = customUrl || `${DEFAULT_BASE_URL}/index.json`;
  if (cachedIndices.has(url)) return cachedIndices.get(url)!;

  const cacheFile = new File(Paths.cache, `${bookId}_index_v2.json`);

  // Try local cache first
  try {
    if (cacheFile.exists) {
      const text = await cacheFile.text();
      const parsed = JSON.parse(text) as EncyclopediaIndex;
      cachedIndices.set(url, parsed);
      return parsed;
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
  cachedIndices.set(url, data);

  try {
    await cacheFile.write(JSON.stringify(data));
  } catch {
    // ignore cache write error
  }

  return data;
}

/**
 * Loads a specific volume chunk for any chunked book.
 */
export async function getVolumeChunk(vol: number, baseUrl?: string, bookId = 'bidayah'): Promise<VolumePayload> {
  const cacheKey = `${bookId}_${vol}`;
  if (memoryVolCache.has(cacheKey)) {
    return memoryVolCache.get(cacheKey)!;
  }

  const volStr = String(vol).padStart(2, '0');
  const cacheFile = new File(Paths.cache, `${bookId}_vol_v2_${volStr}.json`);

  // Try local file cache
  try {
    if (cacheFile.exists) {
      const text = await cacheFile.text();
      const payload = JSON.parse(text) as VolumePayload;
      memoryVolCache.set(cacheKey, payload);
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
  memoryVolCache.set(cacheKey, payload);

  try {
    await cacheFile.write(JSON.stringify(payload));
  } catch {
    // ignore cache write error
  }

  return payload;
}
