/**
 * Structural data copied verbatim from `Baseerah Prototype.dc.html` (renderVals).
 * These are navigation/structure lists (names, ordering, icons), not religious text.
 */

/** Subject icon paths (SD) — 24×24 stroke icons. */
export const ICON = {
  // --- Dedicated Islamic Sacred Glyphs ---
  /** العقيدة والتوحيد: الكعبة المشرفة رمز التوحيد وبيت الله الحرام */
  aqeedah:
    'M12 2L4 6.5v11L12 22l8-4.5V6.5L12 2z M12 22V11 M4 6.5l8 4.5 8-4.5 M4 10l8 4.5 8-4.5 M14.5 14v4.5l3-1.7V12.3z',
  /** الكعبة المشرفة */
  kaaba:
    'M12 2L4 6.5v11L12 22l8-4.5V6.5L12 2z M12 22V11 M4 6.5l8 4.5 8-4.5 M4 10l8 4.5 8-4.5 M14.5 14v4.5l3-1.7V12.3z',
  /** الفقه والعبادات: ميزان الشريعة والأحكام الفقهية الخمسة */
  fiqh:
    'M12 2v19 M7 21h10 M12 5l-8 2 M12 5l8 2 M4 7l-2.5 6.5h5z M20 7l-2.5 6.5h5z M11 2h2 M12 2l-1.5 3h3z',
  /** القرآن والتفسير: المصحف الشريف على حامل الرَّحْلَة الخشبي المطوي */
  tafsir:
    'M3 4.5c3-1.5 6-1.5 9 1 3-2.5 6-2.5 9-1v9c-3-1.5-6-1.5-9 1-3-2.5-6-2.5-9-1z M12 5.5V14 M5 14L19 22 M19 14L5 22 M4 22h3 M17 22h3 M12 14v3',
  /** الحديث النبوي: مخطوطة السند والمتن النبوية مع خاتم الرواية والسماع */
  hadith:
    'M19 17V5a2 2 0 0 0-2-2H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h11a2 2 0 0 0 2-2z M3 6a3 3 0 0 1 3-3h11a2 2 0 0 1 2 2v1 M7 8h10 M7 11.5h10 M7 15h6 M15 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
  /** السيرة النبوية: القبة الخضراء الشريفة والمنارة النبوية بالمدينة المنورة */
  seerah:
    'M11 5c-3 1.5-4 4.5-4 7h8c0-2.5-1-5.5-4-7z M11 2.5v2.5 M5 12h12v9H5z M9 21v-3.5a2 2 0 0 1 4 0V21 M19 21V7l2-2v16 M18 10h4 M2 21h20',
  /** المسبحة الإلكترونية: عقد حبات التسبيح مع الشاهد وشرابة الحرير */
  tasbeeh:
    'M12 2C7 2 4 5.5 4 9.5c0 3 2.5 5 8 7 5.5-2 8-4 8-7C20 5.5 17 2 12 2z M11 16.5h2v2h-2z M12 18.5v3.5 M10 22h4 M12 18.5l-2 3.5 M12 18.5l2 3.5 M9.5 3l.8 1.4 M14.5 3l-.8 1.4 M6.2 5.5l1.2.9 M17.8 5.5l-1.2.9 M4.8 9.5h1.5 M19.2 9.5h-1.5 M6.5 13.5l1.2-.9 M17.5 13.5l-1.2-.9',
  /** الأدعية المأثورة: كفّان مرفوعان بالتضرع والدعاء */
  dua:
    'M12 18.5c-2.5 1.5-5.5 1-6.5-.8L3.5 8.5A1.5 1.5 0 0 1 6 7l1.5 3V3.5a1.5 1.5 0 0 1 3 0v7 M12 18.5c2.5 1.5 5.5 1 6.5-.8l2-9.2A1.5 1.5 0 0 0 18 7l-1.5 3V3.5a1.5 1.5 0 0 0-3 0v7 M12 12.5v6 M7 21h10',
  /** السنن والرواتب: سجادة الصلاة الإسلامية مع المحراب المتجه للقبلة وهدب الخيوط */
  sunan:
    'M6 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z M8 17V11c0-2 2-4 4-5 2 1 4 3 4 5v6 M8 17h8 M8 2v1.5 M12 2v1.5 M16 2v1.5 M8 20.5v1.5 M12 20.5v1.5 M16 20.5v1.5',
  /** أسماء الله الحسنى: الختم الإسلامي الثماني (ربع الحزب) المشع */
  names:
    'M6 6h12v12H6z M12 2.5l9.5 9.5-9.5 9.5-9.5-9.5z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  /** النجمة الإسلامية الثمانية (خاتم التوحيد) */
  star8:
    'M6 6h12v12H6z M12 2.5l9.5 9.5-9.5 9.5-9.5-9.5z M10 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0',

  // --- Classical general glyphs ---
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41',
  scales:
    'M12 3v18 M7 21h10 M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2 M5 8l-3 8c.9.65 1.9 1 3 1s2.1-.35 3-1z M19 8l-3 8c.9.65 1.9 1 3 1s2.1-.35 3-1z',
  book: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8',
  compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z',
  heart:
    'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2',
  pen: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  layers: 'M12 2l10 5-10 5L2 7z M2 17l10 5 10-5 M2 12l10 5 10-5',
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3',
  house2: 'M4 20h16 M6 20V10l6-6 6 6v10',
  music: 'M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  speaker: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z M16 8a5 5 0 0 1 0 8',
  notebook: 'M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z M8 8h8 M8 12h6',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  medal: 'M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M8.5 13.5L7 22l5-3 5 3-1.5-8.5',
  fontSize: 'M3 20l5-14 5 14 M5 15h6 M15 12h5 M17.5 12v8',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  sliders: 'M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h12 M14 4v4 M8 10v4 M16 16v4',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0',
  sync: 'M21 12a9 9 0 0 1-15 6.7L3 16 M3 12a9 9 0 0 1 15-6.7L21 8 M21 3v5h-5 M3 21v-5h5',
  palette:
    'M12 3a9 9 0 1 0 0 18c1 0 2-.8 2-2 0-.6-.3-1-.6-1.4-.3-.4-.4-.8-.4-1.2 0-1 .8-1.9 1.9-1.9H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z',
  headphones: 'M3 14v-2a9 9 0 0 1 18 0v2 M3 14h3v6H4a1 1 0 0 1-1-1z M21 14h-3v6h2a1 1 0 0 0 1-1z',
  cap: 'M22 10L12 5 2 10l10 5 10-5z M6 12v5c3 2 9 2 12 0v-5',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 16v-4 M12 8h.01',
  check: 'M20 6L9 17l-5-5',
  bed: 'M2 12h20 M5 12v6h14v-6 M7 12V8h4v4',
  sunrise: 'M12 3v4 M5.6 5.6l2.8 2.8 M2 14h4 M18 14h4 M18.4 5.6l-2.8 2.8 M6 18a6 6 0 0 1 12 0z',
  sunSmall: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M2 12h2 M20 12h2',
  // UI glyphs
  back: 'M9 5l7 7-7 7',
  forward: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12 M18 6L6 18',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M18 15l-6-6-6 6',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  flag: 'M4 22V4 M4 4h13l-2 4 2 4H4',
  lockBody: 'M5 11h14v10H5z',
  lock: 'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z M8 11V7a4 4 0 0 1 8 0v4',
  prevTrack: 'M5 4l10 8-10 8z M19 4v16',
  nextTrack: 'M19 20L9 12l10-8z M5 4v16',
  scalesSharia: 'M12 3v18 M7 21h10 M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2 M5 8l-3 8c.9.65 1.9 1 3 1s2.1-.35 3-1z M19 8l-3 8c.9.65 1.9 1 3 1s2.1-.35 3-1z',
  // Tab bar icons
  tabHome: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  tabAcademy: 'M22 10 12 5 2 10l10 5 10-5z M6 12v5c3 2 9 2 12 0v-5',
  tabQuran: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
  tabLibrary: 'M4 4v16M9 4v16 M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
  tabAccount: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4 21c0-4 4-6 8-6s8 2 8 6',
  tabMore: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4',
  download: 'M12 3v12 M7 10l5 5 5-5 M5 21h14',
  share: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7 M16 6l-4-4-4 4 M12 2v13',
  pin: 'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z M12 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  sparkle: 'M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01',
} as const;

export interface Subject {
  id: string;
  prefix: string;
  name: string;
  short: string;
  count: number;
  icon: string;
}

/** names + SD — six subjects of stage 1 (8/11/8/8/10/8 = 53 lessons). */
export const SUBJECTS: Subject[] = [
  { id: 'aqeedah', prefix: 'AQ', name: 'العقيدة والتوحيد', short: 'العقيدة', count: 8, icon: ICON.aqeedah },
  { id: 'fiqh', prefix: 'FQ', name: 'الفقه والعبادات', short: 'الفقه', count: 11, icon: ICON.fiqh },
  { id: 'tafsir', prefix: 'TF', name: 'القرآن والتفسير', short: 'التفسير', count: 8, icon: ICON.tafsir },
  { id: 'hadith', prefix: 'HD', name: 'الحديث النبوي', short: 'الحديث', count: 8, icon: ICON.hadith },
  { id: 'seerah', prefix: 'SR', name: 'السيرة النبوية', short: 'السيرة', count: 10, icon: ICON.seerah },
  { id: 'tazkiyah', prefix: 'TZ', name: 'الأخلاق والتزكية', short: 'التزكية', count: 8, icon: ICON.heart },
];

/** Nine subjects of Stage 2 (Level 2: التأصيل والعلوم الآلية - 108 lessons). */
export const STAGE2_SUBJECTS_LIST: Subject[] = [
  { id: 'muamalat', prefix: 'ML', name: 'المعاملات المالية والبيوع المعاصرة', short: 'المعاملات', count: 14, icon: ICON.fiqh },
  { id: 'ahwal', prefix: 'AH', name: 'فقه الأسرة والأحوال الشخصية', short: 'الأحوال', count: 12, icon: ICON.user },
  { id: 'mawarith', prefix: 'MW', name: 'علم الفرائض وقسمة التركات', short: 'المواريث', count: 12, icon: ICON.fiqh },
  { id: 'usul', prefix: 'US', name: 'أصول الفقه ومقاصد الشريعة', short: 'الأصول', count: 14, icon: ICON.layers },
  { id: 'mustalah', prefix: 'MH', name: 'مصطلح الحديث المنهجي', short: 'المصطلح', count: 12, icon: ICON.hadith },
  { id: 'wasitiyyah', prefix: 'WS', name: 'العقيدة الموسعة (الواسطية)', short: 'العقيدة 2', count: 12, icon: ICON.aqeedah },
  { id: 'usul_tafsir', prefix: 'OT', name: 'علوم القرآن وأصول التفسير', short: 'أصول التفسير', count: 10, icon: ICON.tafsir },
  { id: 'arabic', prefix: 'AR', name: 'اللغة العربية والنحو القرآني', short: 'النحو', count: 14, icon: ICON.pen },
  { id: 'qada', prefix: 'QD', name: 'القضاء والسياسة الشرعية', short: 'القضاء', count: 8, icon: ICON.shield },
];

/** Five subjects of Stage 3 (Level 3: التخريج والاجتهاد والترجيح المقارن - 70 lessons). */
export const STAGE3_SUBJECTS_LIST: Subject[] = [
  { id: 'comparative_fiqh', prefix: 'CF', name: 'الفقه المقارن وأدلة المذاهب الأربعة', short: 'الفقه المقارن', count: 16, icon: ICON.fiqh },
  { id: 'advanced_usul', prefix: 'AU', name: 'أصول الفقه الموسع وتخريج الفروع', short: 'الأصول الموسع', count: 14, icon: ICON.layers },
  { id: 'hadith_ilal', prefix: 'IL', name: 'صحيح البخاري وعلل الحديث ودقائقه', short: 'علل الحديث', count: 14, icon: ICON.hadith },
  { id: 'tafsir_comparative', prefix: 'TC', name: 'التفسير المقارن وأحكام القرآن', short: 'التفسير المقارن', count: 14, icon: ICON.tafsir },
  { id: 'nawazil', prefix: 'NW', name: 'فقه النوازل المعاصرة والمقاصد الكبرى', short: 'النوازل', count: 12, icon: ICON.compass },
];

export const ALL_SUBJECTS: Subject[] = [...SUBJECTS, ...STAGE2_SUBJECTS_LIST, ...STAGE3_SUBJECTS_LIST];

/**
 * Every lesson code of the stage-1 curriculum outline (AQ-01 … TZ-08). Used to pre-render lesson
 * routes on the web; the lessons themselves come from the console. `count` is the design's plan and
 * the default for `app_config.curriculum`.
 */
export const LESSON_CODES: string[] = SUBJECTS.flatMap((s) => Array.from({ length: s.count }, (_, i) => `${s.prefix}-${String(i + 1).padStart(2, '0')}`));

export const STAGE2_LESSON_CODES: string[] = STAGE2_SUBJECTS_LIST.flatMap((s) => Array.from({ length: s.count }, (_, i) => `${s.prefix}-${String(i + 1).padStart(2, '0')}`));

export const STAGE3_LESSON_CODES: string[] = STAGE3_SUBJECTS_LIST.flatMap((s) => Array.from({ length: s.count }, (_, i) => `${s.prefix}-${String(i + 1).padStart(2, '0')}`));

export const ALL_LESSON_CODES: string[] = [...LESSON_CODES, ...STAGE2_LESSON_CODES, ...STAGE3_LESSON_CODES];

export const lessonCountLabel = (n: number) => `${n}${n === 11 ? ' درسًا' : ' دروس'}`;

/** Evidence reliability levels (LV / LVN). */
export const LEVELS = ['مجمع عليه', 'قول الجمهور', 'خلاف معتبر', 'اجتهاد لم يُعتمد بعد'] as const;
export const LEVEL_NOTES = [
  'مجمع عليه: لا خلاف معتبرًا فيه بين أهل العلم.',
  'قول الجمهور مع وجود خلاف؛ يُعرض الخلاف.',
  'خلاف معتبر بين أهل العلم؛ تُعرض الأقوال وأدلتها دون ترجيح مطلق.',
  'اجتهاد لم يُعتمد بعد؛ يُعرض للعلم لا للعمل.',
] as const;
export const LEVEL_NONE = 'لم يُصنَّف بعد — لا يُعرض كحقيقة قطعية.';

/** Report reasons (RR). */
export const REPORT_REASONS = ['خطأ في النص', 'مصدر أو تخريج غير صحيح', 'خطأ إملائي أو لغوي', 'محتوى غير مناسب', 'أخرى'] as const;

export const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'] as const;

/** Knowledge map (MN): [name, x, y, prereqs, note] on a 350×900 canvas. */
export interface MapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  prereqs: string[];
  note: string;
}
export const MAP_NODES: MapNode[] = (
  [
    ['tawheed', 'التوحيد', 175, 50, [], 'أساس كل علم؛ يُبنى عليه ما بعده.'],
    ['aqeedah', 'العقيدة', 54, 160, ['tawheed'], 'أركان الإيمان وأصول الاعتقاد.'],
    ['taharah', 'الطهارة', 175, 160, ['tawheed'], 'مدخل العبادات العملية.'],
    ['recite', 'القراءة والتلاوة', 297, 160, ['tawheed'], 'حسن القراءة قبل التفسير.'],
    ['hadith', 'الحديث النبوي', 54, 270, ['aqeedah'], 'مدخل إلى السنة وروايتها.'],
    ['salah', 'الصلاة', 175, 270, ['taharah'], 'أحكام الصلاة وأركانها.'],
    ['tajweed', 'التجويد', 297, 270, ['recite'], 'إتقان أحكام التلاوة.'],
    ['seerah', 'السيرة النبوية', 54, 380, ['aqeedah'], 'سيرة النبي ﷺ ودروسها.'],
    ['zakat', 'الزكاة', 135, 380, ['salah'], 'أحكام الزكاة ومصارفها.'],
    ['siyam', 'الصيام', 216, 380, ['salah'], 'أحكام الصيام وآدابه.'],
    ['tafsir', 'التفسير', 297, 380, ['tajweed'], 'فهم معاني القرآن.'],
    ['mustalah', 'مصطلح الحديث', 54, 490, ['hadith'], 'قواعد قبول الأخبار وردّها.'],
    ['muamalat', 'المعاملات', 135, 490, ['zakat'], 'أحكام البيع والعقود.'],
    ['hajj', 'الحج والعمرة', 216, 490, ['siyam'], 'المناسك وأحكامها.'],
    ['arabic', 'اللغة العربية', 297, 490, ['tafsir'], 'أداة فهم النصوص.'],
    ['mawarith', 'المواريث', 135, 600, ['muamalat'], 'أحكام التركات وتقسيمها.'],
    ['ahwal', 'الأحوال الشخصية', 216, 600, ['muamalat'], 'النكاح والأسرة.'],
    ['usul', 'أصول الفقه', 175, 710, ['mawarith', 'ahwal', 'arabic'], 'كيف تُستنبط الأحكام من أدلتها.'],
    ['qada', 'القضاء', 175, 820, ['usul'], 'تعليمي فقط؛ لا إصدار أحكام على الأشخاص.'],
  ] as const
).map(([id, name, x, y, prereqs, note]) => ({ id, name, x, y, prereqs: [...prereqs], note }));

export const MAP_LINK_TILES = ['دروس ذات صلة', 'كتب', 'أدلة شرعية', 'مواد صوتية'] as const;

/**
 * Thematic paths (PATHS): the four paths of the design. Their steps (lesson / ruling / audio / book /
 * quote, each linking to the screen it points to) are published from the console (kind path, slot = id).
 */
export interface PathDef {
  id: string;
  title: string;
  tag: string;
}
export const PATHS: PathDef[] = [
  { id: 'ramadan', title: 'مسار الصيام', tag: 'موسمي · رمضان' },
  { id: 'hajj', title: 'مناسك الحج والعمرة', tag: 'موسمي · الحج' },
  { id: 'salah', title: 'الصلاة خطوة بخطوة', tag: 'أساسي' },
  { id: 'tazkiya', title: 'تزكية النفس', tag: 'أساسي' },
];

/** Encyclopedia (SH). */
export const SHARIA_TOPICS: { name: string; subs: string[] }[] = [
  { name: 'العبادات', subs: ['الطهارة', 'الصلاة', 'الزكاة', 'الصيام', 'الحج والعمرة'] },
  { name: 'المعاملات', subs: ['البيوع', 'الإجارة', 'الشركات', 'الرهن والضمان'] },
  { name: 'الأحوال الشخصية', subs: ['النكاح', 'الطلاق', 'الحضانة والنفقة'] },
  { name: 'المواريث', subs: ['أصحاب الفروض', 'العصبات', 'الحجب'] },
  { name: 'القضاء', subs: ['أحكام القضاء', 'الدعاوى والبيّنات'] },
  { name: 'الحدود والقصاص والتعزير', subs: ['مفهومها وشروطها', 'ضوابطها'] },
  { name: 'أصول الفقه', subs: ['الأدلة', 'دلالات الألفاظ', 'المقاصد'] },
  { name: 'الفتاوى الموثقة', subs: ['فتاوى مصنّفة'] },
];
export const SHARIA_SECTIONS = ['المسألة', 'الحكم', 'الدليل', 'أقوال أهل العلم', 'المراجع والإشراف العلمي'] as const;

/** Prophets / angels / companions (STD). */
export type StoryTab = 'prophets' | 'angels' | 'companions';
export const STORIES: Record<StoryTab, { name: string; note: string; list: string[]; secs: string[] }> = {
  prophets: {
    name: 'الأنبياء',
    note: 'الأنبياء المذكورون في القرآن الكريم. لكل نبي بطاقة خطّية. المحتوى التفصيلي يُدرج بعد المراجعة العلمية.',
    list: ['آدم', 'إدريس', 'نوح', 'هود', 'صالح', 'إبراهيم', 'لوط', 'إسماعيل', 'إسحاق', 'يعقوب', 'يوسف', 'أيوب', 'شعيب', 'موسى', 'هارون', 'ذو الكفل', 'داود', 'سليمان', 'إلياس', 'اليسع', 'يونس', 'زكريا', 'يحيى', 'عيسى', 'محمد'],
    secs: ['نسبه وزمنه', 'قومه ودعوته', 'ما ذُكر في القرآن', 'الدروس والعبر', 'المراجع'],
  },
  angels: {
    name: 'الملائكة',
    note: 'الإيمان بالملائكة من أركان الإيمان. المحتوى يُدرج من الكتاب والسنة الصحيحة فقط.',
    list: ['جبريل', 'ميكائيل', 'إسرافيل', 'مالك', 'الكرام الكاتبون', 'حملة العرش'],
    secs: ['وظيفتهم', 'ما ورد في الوحي', 'الإيمان بالملائكة', 'المراجع'],
  },
  companions: {
    name: 'الصحابة',
    note: 'الصحابة رضي الله عنهم. نبدأ بالعشرة المبشّرين بالجنة، ثم يُضاف غيرهم بعد التوثيق.',
    list: ['أبو بكر الصديق', 'عمر بن الخطاب', 'عثمان بن عفان', 'علي بن أبي طالب', 'طلحة بن عبيد الله', 'الزبير بن العوام', 'عبد الرحمن بن عوف', 'سعد بن أبي وقاص', 'سعيد بن زيد', 'أبو عبيدة بن الجراح'],
    secs: ['نسبه وإسلامه', 'مناقبه الثابتة', 'مواقفه', 'المراجع'],
  },
};
export const STORY_TABS: { id: StoryTab; label: string }[] = [
  { id: 'prophets', label: 'الأنبياء' },
  { id: 'angels', label: 'الملائكة' },
  { id: 'companions', label: 'الصحابة' },
];

/** Honorific. The prototype appended the plural «عليهم السلام» to every angel; groups keep the
 *  plural, individual named angels take the singular. */
const ANGEL_GROUPS = ['الكرام الكاتبون', 'حملة العرش'];
export function storySuffix(tab: StoryTab, name: string): string {
  if (tab === 'prophets') return name === 'محمد' ? 'صلى الله عليه وسلم' : 'عليه السلام';
  if (tab === 'angels') return ANGEL_GROUPS.includes(name) ? 'عليهم السلام' : 'عليه السلام';
  return 'رضي الله عنه';
}
export function storyTitle(tab: StoryTab, name: string): string {
  if (tab === 'companions') return name;
  if (tab === 'prophets') return 'النبي ' + name;
  return name.includes('ال') && name !== 'مالك' ? name : 'الملك ' + name;
}

/** Adhkar categories (HAD). Texts, counts and sources are published from the console (kind adhkar, slot = id). */
export const ADHKAR = [
  { id: 'morning', name: 'أذكار الصباح', icon: ICON.sunSmall },
  { id: 'evening', name: 'أذكار المساء', icon: ICON.moon },
  { id: 'after-prayer', name: 'أذكار بعد الصلاة', icon: ICON.check },
  { id: 'sleep', name: 'أذكار النوم', icon: ICON.bed },
  { id: 'waking', name: 'أذكار الاستيقاظ', icon: ICON.sunrise },
  { id: 'mosque', name: 'أذكار المسجد', icon: ICON.pin },
  { id: 'wudhu', name: 'أذكار الوضوء', icon: ICON.sparkle },
  { id: 'food', name: 'أذكار الطعام والشراب', icon: ICON.tag },
  { id: 'travel', name: 'أذكار السفر', icon: ICON.forward },
  { id: 'distress', name: 'أذكار الكرب والهم', icon: ICON.heart },
  { id: 'ruqyah', name: 'الرقية الشرعية', icon: ICON.book },
  { id: 'daily-life', name: 'أذكار جامعة ومتفرقة', icon: ICON.sparkle },
] as const;

/** Hijri month names (HM), sacred months, events (HEV/HEVD), seasons (SEA). */
export const HIJRI_MONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
export const SACRED_MONTHS = [0, 6, 10, 11];
export const WHITE_DAYS = [13, 14, 15];
export const HIJRI_EVENTS: Record<number, { day: number; label: string }[]> = {
  0: [
    { day: 1, label: '1 محرم: رأس السنة الهجرية' },
    { day: 10, label: '10 محرم: يوم عاشوراء' },
  ],
  8: [{ day: 1, label: '1 رمضان: بداية الصيام' }],
  9: [{ day: 1, label: '1 شوال: عيد الفطر' }],
  11: [
    { day: 9, label: '9 ذو الحجة: يوم عرفة' },
    { day: 10, label: '10 ذو الحجة: عيد الأضحى' },
  ],
};
export const WEEKDAYS_SAT_FIRST = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'];
export const SEASONS = [
  { name: 'رمضان', when: 'شهر الصيام والقرآن', path: 'ramadan' },
  { name: 'الحج والعمرة', when: 'ذو الحجة', path: 'hajj' },
  // Kept from the prototype: the white days link to the fasting path.
  { name: 'الأيام البيض', when: '13 و14 و15 من كل شهر', path: 'ramadan' },
  { name: 'الأشهر الحرم', when: 'محرم · رجب · ذو القعدة · ذو الحجة', path: 'tazkiya' },
];

/** Library categories (ART): icon + oklch hue. */
export const LIBRARY_ART: Record<string, { icon: string; hue: number }> = {
  العقيدة: { icon: ICON.aqeedah, hue: 165 },
  الفقه: { icon: ICON.fiqh, hue: 215 },
  التفسير: { icon: ICON.tafsir, hue: 265 },
  الحديث: { icon: ICON.hadith, hue: 25 },
  السيرة: { icon: ICON.seerah, hue: 75 },
  'التاريخ الإسلامي': { icon: ICON.clock, hue: 330 },
  'اللغة العربية': { icon: ICON.pen, hue: 120 },
  'أصول الفقه': { icon: ICON.layers, hue: 190 },
  'شروح العلماء': { icon: ICON.mic, hue: 165 },
  'المحاضرات والدروس': { icon: ICON.house2, hue: 245 },
  'التلاوات القرآنية': { icon: ICON.tafsir, hue: 140 },
  'الأناشيد المنتقاة': { icon: ICON.music, hue: 300 },
  'الخطب والدروس العلمية': { icon: ICON.speaker, hue: 50 },
};
export const BOOK_CATEGORIES = ['العقيدة', 'الفقه', 'التفسير', 'الحديث', 'السيرة', 'التاريخ الإسلامي', 'اللغة العربية', 'أصول الفقه'];
export const AUDIO_CATEGORIES = ['شروح العلماء', 'المحاضرات والدروس', 'التلاوات القرآنية', 'الأناشيد المنتقاة', 'الخطب والدروس العلمية'];
export const DOWNLOAD_QUOTA_MB = 200;

/** Tajweed (tjFirst/tjList) and the listening drill (DR: options + correct index). */
export const TAJWEED_FIRST = 'أحكام النون الساكنة والتنوين';
export const TAJWEED_LIST = ['أحكام الميم الساكنة', 'المدود', 'القلقلة', 'التفخيم والترقيق'];
/** Tajweed topics in teaching order; each topic's text is published from the console (kind tajweed, slot = index). */
export const TAJWEED_TOPICS = [TAJWEED_FIRST, ...TAJWEED_LIST];

/** Daily plan templates (PL). `{code}` / `{title}` are filled from the current lesson. */
export const PLAN_TEMPLATES: Record<5 | 15 | 30, { title: string; sub: string; min: number }[]> = {
  5: [
    { title: 'درس اليوم', sub: 'مختصر · {code}', min: 3 },
    { title: 'مراجعة', sub: 'بطاقتان', min: 2 },
    { title: 'ورد القرآن', sub: 'آية واحدة', min: 2 },
  ],
  15: [
    { title: 'درس اليوم', sub: '{title}', min: 8 },
    { title: 'مراجعة', sub: '3 بطاقات', min: 4 },
    { title: 'ورد القرآن', sub: 'صفحة من المصحف', min: 3 },
  ],
  30: [
    { title: 'درس اليوم', sub: '{title} + اختبار', min: 15 },
    { title: 'مراجعة', sub: '5 بطاقات', min: 6 },
    { title: 'ورد القرآن', sub: 'وجه من المصحف', min: 5 },
    { title: 'ذكر وتدبّر', sub: 'أذكار الصباح', min: 4 },
  ],
};
