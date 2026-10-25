/**
 * Classical Islamic Library Textbooks (أمهات كتب التراث المقررة).
 * Complete, in-depth authentic texts according to the Sunni curriculum.
 *
 * NOTE: Books are loaded dynamically from Supabase over the internet (published_content)
 * and cached in AsyncStorage at runtime. The local bundle contains NO hardcoded books
 * to keep the application download size minimal and lightweight.
 */
import type { LibraryItem } from '@/state/content-store';

export const DEFAULT_LIBRARY: LibraryItem[] = [
  {
    id: 'al-bidayah-wan-nihayah',
    kind: 'book',
    category: 'التاريخ الإسلامي',
    title: 'البداية والنهاية (الموسوعة الكاملة 21 مجلداً)',
    author: 'الحافظ عماد الدين إسماعيل بن كثير (ت 774هـ)',
    source: 'دار هجر — تحقيق د. عبد الله بن عبد المحسن التركي',
    pages: 13078,
    size_mb: 21.5,
    paged: true,
    audio_url: null,
    chapters: [],
    indexUrl: 'https://yxqdquynlgfbxyultsux.supabase.co/storage/v1/object/public/apks/encyclopedia/bidayah/index.json',
  },
];
