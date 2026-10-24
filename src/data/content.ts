/**
 * Educational content model. Nothing is bundled: every lesson, evidence card, quote and other
 * text is created in the console (/admin), approved by scholars and read from Supabase
 * `published_content` (see `src/state/content-store.ts`). Each kind's `data` is validated here;
 * invalid items are dropped rather than shown. Empty slots render as «بانتظار التوثيق».
 */
import { z } from 'zod';

/** https media URLs only. */
const HttpsUrl = z.string().url().startsWith('https://');
/** In-app route such as `/academy/lesson/AQ-01` — never another site (`//host`, `https://…`). */
const AppRoute = z.string().regex(/^\/(?!\/)[^\s\\]*$/);

const ReviewFields = {
  wajh: z.string().optional(),
  explain: z.string().optional(),
  level: z.number().int().min(1).max(4).optional(),
  reviewers: z.array(z.string()).optional(),
  reviewedAt: z.string().optional(),
};

export const EvidenceSchema = z.object({
  kind: z.enum(['quran', 'hadith', 'ref']),
  label: z.string(),
  text: z.string().nullable(),
  source: z.string().default(''),
  ref: z.string().default(''),
  ...ReviewFields,
});

export const SectionSchema = z.object({ heading: z.string(), body: z.string(), ...ReviewFields });

export const QuestionSchema = z.object({
  id: z.string().min(1),
  q: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.number().int().min(0),
  explain: z.string().default(''),
});

/** `published_content.data` for kind = lesson (slot = lesson code). */
export const LessonDataSchema = z.object({
  title: z.string().min(1),
  minutes: z.number().int().positive().default(10),
  /** Verified audio explanation (URL). */
  audio: HttpsUrl.optional(),
  objectives: z.array(z.string()),
  sections: z.array(SectionSchema),
  summary: z.array(z.string()).default([]),
  quiz: z.object({ passPct: z.number().int().min(50).max(100), questions: z.array(QuestionSchema).min(1) }),
});

export const LessonSchema = LessonDataSchema.extend({
  code: z.string().regex(/^[A-Z]{2}-\d{2}$/),
  /** Published evidence cards for this lesson (kind = evidence, slot = `${code}/eN`). */
  evidence: z.array(EvidenceSchema),
});

export const QuoteDataSchema = z.object({
  cat: z.string(),
  text: z.string().min(1),
  scholar: z.string().min(1),
  source: z.string().min(1),
  ...ReviewFields,
});
export const QuoteSchema = z.object({
  id: z.string(),
  cat: z.string(),
  text: z.string().nullable(),
  scholar: z.string().nullable(),
  source: z.string().nullable(),
  wajh: z.string().optional(),
  explain: z.string().optional(),
  level: z.number().int().min(1).max(4).optional(),
  reviewers: z.array(z.string()).optional(),
  reviewedAt: z.string().optional(),
});

const SourcedText = z.object({ text: z.string().min(1), source: z.string().min(1), ref: z.string().optional(), ...ReviewFields });
/** kind = story (slot `${tab}/${i}`) and sharia (slot `${topic}/${sub}`): sections keyed by heading. */
export const SectionsDataSchema = z.object({ sections: z.record(z.string(), SourcedText) });
/** kind = adhkar (slot = category id). */
export const AdhkarDataSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      count: z.number().int().min(1),
      source: z.string().min(1),
      ref: z.string().optional(),
      virtue: z.string().optional(),
      ...ReviewFields,
    }),
  ),
});
/** kind = tafsir (slot = surah number). */
export const TafsirDataSchema = z.object({ tafsir: z.string().min(1), source: z.string().min(1), ayahs: z.record(z.string(), z.string()) });
/** kind = tajweed (slot = topic index in TAJWEED_TOPICS). */
export const TajweedDataSchema = z.object({ text: z.string().min(1), examples: z.array(z.string()).default([]), source: z.string().min(1) });
/** kind = drill (slot = 'main'). */
export const DrillDataSchema = z.object({
  questions: z.array(z.object({ id: z.string(), q: z.string().default(''), audio: HttpsUrl, options: z.array(z.string()).min(2), answer: z.number().int().min(0), source: z.string().min(1) })).min(1),
});
/** kind = path (slot = path id). Targets are app routes (e.g. `/academy/lesson/AQ-01`). */
export const PathDataSchema = z.object({
  minutes: z.number().int().positive().optional(),
  steps: z.array(z.object({ kind: z.enum(['درس', 'حكم', 'صوتي', 'كتاب', 'قول']), title: z.string().min(1), target: AppRoute.optional() })).min(1),
});
/** kind = map (slot = knowledge-map node id). */
export const MapDataSchema = z.object({ links: z.array(z.object({ label: z.string().min(1), target: AppRoute })).min(1) });
/** kind = page (slot = 'funding'). */
export const PageDataSchema = z.object({ sections: z.array(z.object({ heading: z.string().min(1), body: z.string().min(1) })).min(1) });

/** kind = vocab (slot = vocab slug, e.g. 'taghut'). مفردات وغريب القرآن الكريم. */
export const QuranVocabAyahSchema = z.object({
  surah: z.number().int().min(1).max(114),
  ayah: z.number().int().min(1),
  surahName: z.string().min(1),
  text: z.string().min(1),
  tafsir: z.string().min(1),
  source: z.string().min(1),
  wajh: z.string().min(1),
});

export const QuranVocabScholarQuoteSchema = z.object({
  scholar: z.string().min(1),
  text: z.string().min(1),
  source: z.string().min(1),
});

export const QuranVocabItemSchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  root: z.string().optional(),
  category: z.string().min(1),
  meaning: z.string().min(1),
  ayahs: z.array(QuranVocabAyahSchema).min(1),
  quotes: z.array(QuranVocabScholarQuoteSchema).default([]),
  ...ReviewFields,
});

export type QuranVocabItem = z.infer<typeof QuranVocabItemSchema>;
export type QuranVocabAyah = z.infer<typeof QuranVocabAyahSchema>;
export type QuranVocabScholarQuote = z.infer<typeof QuranVocabScholarQuoteSchema>;

export type Evidence = z.infer<typeof EvidenceSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type SectionsData = z.infer<typeof SectionsDataSchema>;
export type AdhkarData = z.infer<typeof AdhkarDataSchema>;
export type TafsirData = z.infer<typeof TafsirDataSchema>;
export type TajweedData = z.infer<typeof TajweedDataSchema>;
export type DrillData = z.infer<typeof DrillDataSchema>;
export type PathData = z.infer<typeof PathDataSchema>;
export type MapData = z.infer<typeof MapDataSchema>;
export type PageData = z.infer<typeof PageDataSchema>;

/** Data passed to the evidence-chain sheet (any of the optional review fields may be present). */
export type ChainData = Partial<Pick<Evidence, 'text' | 'source' | 'ref' | 'wajh' | 'explain' | 'level' | 'reviewers' | 'reviewedAt'>>;

/** Lessons of one subject (AQ = العقيدة والتوحيد), in code order. */
export function lessonsFor(lessons: Lesson[], prefix: string): Lesson[] {
  return lessons.filter((l) => l.code.startsWith(prefix + '-'));
}

export function lessonByCode(lessons: Lesson[], code: string): Lesson | undefined {
  return lessons.find((l) => l.code === code);
}

/** Quote is verified only when text, scholar and source are all present (HANDOFF §1). */
export function isVerifiedQuote(q: Quote): boolean {
  return !!(q.text && q.scholar && q.source);
}
