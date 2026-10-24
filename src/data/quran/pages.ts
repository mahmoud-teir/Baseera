/**
/**
 * بيانات وتقسيم صفحات المصحف الشريف — مصحف المدينة النبوية (٦٠٤ صفحات)
 * متطابقة ١٠٠٪ مع مشروع تنزيل ومجمع الملك فهد لطباعة المصحف الشريف.
 */
import rawPages from './pages.json';
import meta from './meta.json';

export interface PageEntry {
  /** رقم الصفحة (1..604) */
  p: number;
  /** رقم السورة التي تبدأ بها الصفحة (1..114) */
  s: number;
  /** رقم الآية التي تبدأ بها الصفحة */
  a: number;
  /** رقم الجزء (1..30) */
  j: number;
}

export interface SurahPageSegment {
  /** رقم الصفحة في المصحف (1..604) */
  page: number;
  /** رقم الجزء (1..30) */
  juz: number;
  /** أول آية من السورة في هذه الصفحة */
  startAyah: number;
  /** آخر آية من السورة في هذه الصفحة */
  endAyah: number;
  /** هل تبدأ السورة في هذه الصفحة وتحتاج البسملة */
  hasBasmala: boolean;
}

export const QURAN_PAGES: PageEntry[] = rawPages as PageEntry[];

const JUZ_NAMES = [
  'الجزء الأول',
  'الجزء الثاني',
  'الجزء الثالث',
  'الجزء الرابع',
  'الجزء الخامس',
  'الجزء السادس',
  'الجزء السابع',
  'الجزء الثامن',
  'الجزء التاسع',
  'الجزء العاشر',
  'الجزء الحادي عشر',
  'الجزء الثاني عشر',
  'الجزء الثالث عشر',
  'الجزء الرابع عشر',
  'الجزء الخامس عشر',
  'الجزء السادس عشر',
  'الجزء السابع عشر',
  'الجزء الثامن عشر',
  'الجزء التاسع عشر',
  'الجزء العشرون',
  'الجزء الحادي والعشرون',
  'الجزء الثاني والعشرون',
  'الجزء الثالث والعشرون',
  'الجزء الرابع والعشرون',
  'الجزء الخامس والعشرون',
  'الجزء السادس والعشرون',
  'الجزء السابع والعشرون',
  'الجزء الثامن والعشرون',
  'الجزء التاسع والعشرون',
  'الجزء الثلاثون',
];

/** اسم الجزء باللغة العربية */
export function juzName(juz: number): string {
  return JUZ_NAMES[Math.max(1, Math.min(30, juz)) - 1];
}

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** تحويل الرقم إلى الأرقام المشرقية العربية (١، ٢، ٣...) */
export function toArabicDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

/** تحديد رقم صفحة المصحف لآية معينة في سورة معينة */
export function getPageForAyah(surah: number, ayah: number): number {
  for (let i = QURAN_PAGES.length - 1; i >= 0; i--) {
    const p = QURAN_PAGES[i];
    if (p.s < surah || (p.s === surah && p.a <= ayah)) {
      return p.p;
    }
  }
  return 1;
}

/** تحديد مقاطع صفحات المصحف لسورة محددة بالكامل */
export function getPagesForSurah(surah: number): SurahPageSegment[] {
  const surahs = meta.sura;
  const sMeta = surahs[Math.max(1, Math.min(114, surah)) - 1];
  const totalAyas = sMeta.ayas;
  const segments: SurahPageSegment[] = [];

  let curAyah = 1;
  while (curAyah <= totalAyas) {
    const pageNum = getPageForAyah(surah, curAyah);
    const pageData = QURAN_PAGES[pageNum - 1];
    const nextPageData = QURAN_PAGES[pageNum];

    let endAyah: number;
    if (nextPageData) {
      if (nextPageData.s === surah) {
        endAyah = nextPageData.a - 1;
      } else {
        endAyah = totalAyas;
      }
    } else {
      endAyah = totalAyas;
    }

    segments.push({
      page: pageNum,
      juz: pageData.j,
      startAyah: curAyah,
      endAyah: Math.min(endAyah, totalAyas),
      hasBasmala: curAyah === 1 && surah !== 9 && surah !== 1,
    });

    curAyah = endAyah + 1;
  }

  return segments;
}
