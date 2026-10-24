/**
/**
 * خدمة تفاسير القرآن الكريم — موثقة من أمهات كتب التفسير المعتمدة لأهل السنة والجماعة.
 * يدعم 6 تفاسير كبرى مع كاش محلي كامل وتنزيل بدون اتصال:
 * 1) تفسير السعدي (تيسير الكريم الرحمن في تفسير كلام المنان) — الافتراضي والموصى به
 * 2) التفسير الميسر (مجمع الملك فهد لطباعة المصحف الشريف)
 * 3) تفسير ابن كثير (تفسير القرآن العظيم)
 * 4) تفسير البغوي (معالم التنزيل)
 * 5) تفسير القرطبي (الجامع لأحكام القرآن)
 * 6) تفسير الطبري (جامع البيان عن تأويل آي القرآن)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export interface TafsirInfo {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  author: string;
  source: string;
  desc: string;
}

export const TAFSIRS: TafsirInfo[] = [
  {
    id: 'saadi',
    slug: 'ar-tafseer-al-saddi',
    name: 'تفسير السعدي',
    shortName: 'السعدي',
    author: 'الشيخ عبد الرحمن بن ناصر السعدي رحمه الله',
    source: 'تيسير الكريم الرحمن في تفسير كلام المنان',
    desc: 'ميسر، واضح العبارة، يعتني بالعقيدة والمعنى الإجمالي للآيات',
  },
  {
    id: 'muyassar',
    slug: 'ar-tafsir-muyassar',
    name: 'التفسير الميسر',
    shortName: 'الميسر',
    author: 'نخبة من العلماء',
    source: 'مجمع الملك فهد لطباعة المصحف الشريف',
    desc: 'تفسير وجيز معتمد من مجمع الملك فهد، يوافق رسم المصحف الشريف',
  },
  {
    id: 'ibn-kathir',
    slug: 'ar-tafsir-ibn-kathir',
    name: 'تفسير ابن كثير',
    shortName: 'ابن كثير',
    author: 'الحافظ عماد الدين ابن كثير رحمه الله',
    source: 'تفسير القرآن العظيم',
    desc: 'عمدة التفاسير بالمأثور، يفسر القرآن بالقرآن ثم بالسنة النبوية والآثار',
  },
  {
    id: 'baghawi',
    slug: 'ar-tafsir-al-baghawi',
    name: 'تفسير البغوي',
    shortName: 'البغوي',
    author: 'الإمام محيي السنة الحسين بن مسعود البغوي رحمه الله',
    source: 'معالم التنزيل في تفسير القرآن',
    desc: 'تفسير سلفي معتنٍ بالسنة وأسباب النزول وأقوال الصحابة والتابعين',
  },
  {
    id: 'qurtubi',
    slug: 'ar-tafseer-al-qurtubi',
    name: 'تفسير القرطبي',
    shortName: 'القرطبي',
    author: 'الإمام أبو عبد الله القرطبي رحمه الله',
    source: 'الجامع لأحكام القرآن',
    desc: 'أشهر تفاسير آيات الأحكام الفقهية مع استنباط الأدلة واللغة',
  },
  {
    id: 'tabari',
    slug: 'ar-tafsir-al-tabari',
    name: 'تفسير الطبري',
    shortName: 'الطبري',
    author: 'الإمام محمد بن جرير الطبري رحمه الله',
    source: 'جامع البيان عن تأويل آي القرآن',
    desc: 'إمام المفسرين ورأس كتب التفسير بالمأثور بالأسانيد والترجيح',
  },
];

export const DEFAULT_TAFSIR = TAFSIRS[0];

/** إيجاد بيانات التفسير حسب الاسم أو المعرف أو المسار */
export function getTafsirInfo(query?: string | null): TafsirInfo {
  if (!query) return DEFAULT_TAFSIR;
  const q = query.trim().toLowerCase();
  const found = TAFSIRS.find(
    (t) =>
      t.id.toLowerCase() === q ||
      t.slug.toLowerCase() === q ||
      t.name === query ||
      t.shortName === query ||
      query.includes(t.shortName)
  );
  return found ?? DEFAULT_TAFSIR;
}

/** تنظيف نص التفسير من وسوم HTML والزوائد */
export function cleanTafsirText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<span[^>]*class="[^"]*arabic[^"]*"[^>]*>\{[^}]+\}<\/span>/gi, '') // إزالة نص الآية المكرر إذا وجد في التفسير
    .replace(/<[^>]+>/g, '') // إزالة وسوم HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\r?\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/** كاش ذاكرة سريع لتقليل قراءة التخزين واستدعاءات الشبكة */
const MEM_CACHE: Record<string, Record<number, string>> = {};

const storageKey = (slug: string, surah: number) => `@tafsir:${slug}:${surah}`;

/** تحميل تفسير سورة كاملة مع الكاش المحلي */
export async function loadSurahTafsir(
  slug: string,
  surah: number
): Promise<Record<number, string> | null> {
  const cacheId = `${slug}:${surah}`;
  if (MEM_CACHE[cacheId]) return MEM_CACHE[cacheId];

  // فحص التخزين المحلي أولاً
  try {
    const raw = await AsyncStorage.getItem(storageKey(slug, surah));
    if (raw) {
      const parsed = JSON.parse(raw);
      MEM_CACHE[cacheId] = parsed;
      return parsed;
    }
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }

  // الجلب من الشبكة (CDN موثق وسريع جداً بطلب واحد للسورة كاملة)
  try {
    const url = `https://api.qurancdn.com/api/v4/tafsirs/${slug}/by_chapter/${surah}?per_page=300`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const tafsirsList = json.tafsirs;
    if (!Array.isArray(tafsirsList)) return null;

    const ayahsMap: Record<number, string> = {};
    for (const item of tafsirsList) {
      if (!item.verse_key || !item.text) continue;
      const parts = item.verse_key.split(':');
      const ayahNum = Number(parts[1]);
      if (ayahNum) {
        ayahsMap[ayahNum] = cleanTafsirText(item.text);
      }
    }

    MEM_CACHE[cacheId] = ayahsMap;

    // حفظ في التخزين المحلي ليعمل بدون إنترنت للأبد
    AsyncStorage.setItem(storageKey(slug, surah), JSON.stringify(ayahsMap)).catch(() => {});

    return ayahsMap;
  } catch {
    return null;
  }
}

/** هوك React للحصول على تفسير آية معينة مع التبديل السريع والكاش */
export function useAyahTafsir(
  surah: number,
  ayah: number,
  tafsirQuery?: string | null
) {
  const tafsirInfo = getTafsirInfo(tafsirQuery);
  const cacheKey = `${tafsirInfo.slug}:${surah}`;
  const cached = MEM_CACHE[cacheKey];

  const [data, setData] = useState<{
    key: string;
    map: Record<number, string> | null;
    loading: boolean;
    error: boolean;
  }>(() => ({
    key: cacheKey,
    map: cached ?? null,
    loading: !cached,
    error: false,
  }));
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((c) => c + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    if (MEM_CACHE[cacheKey]) return;

    loadSurahTafsir(tafsirInfo.slug, surah)
      .then((map) => {
        if (!alive) return;
        setData({ key: cacheKey, map, loading: false, error: !map });
      })
      .catch(() => {
        if (!alive) return;
        setData({ key: cacheKey, map: null, loading: false, error: true });
      });

    return () => {
      alive = false;
    };
  }, [cacheKey, tafsirInfo.slug, surah, attempt]);

  const map = data.key === cacheKey ? data.map : cached ?? null;
  const loading = data.key === cacheKey ? data.loading : !map;
  const error = data.key === cacheKey ? data.error : false;
  const text = map ? (map[ayah] ?? (ayah > 1 ? map[ayah - 1] ?? null : null)) : null;

  return { text, loading, error, retry, tafsirInfo };
}

/** تنزيل التفسير كاملاً (114 سورة) للاستخدام بلا اتصال إطلاقاً */
export async function downloadFullTafsir(
  slug: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ ok: boolean; count: number; error?: string }> {
  let done = 0;
  const total = 114;

  for (let s = 1; s <= total; s++) {
    try {
      const res = await loadSurahTafsir(slug, s);
      if (res && Object.keys(res).length > 0) {
        done++;
      }
    } catch {
      // استمرار مع بقية السور
    }
    if (onProgress) onProgress(s, total);
  }

  // حفظ علامة التنزيل الكامل
  if (done >= 110) {
    await AsyncStorage.setItem(`@tafsir_downloaded:${slug}`, 'true').catch(() => {});
  }

  return { ok: done >= 110, count: done };
}

/** التحقق هل التفسير منزّل كاملاً محلياً */
export async function isTafsirDownloaded(slug: string): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(`@tafsir_downloaded:${slug}`);
    return val === 'true';
  } catch {
    return false;
  }
}
