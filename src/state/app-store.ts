/**
 * Persisted, local-first application state. Everything the user does is saved on the device
 * (HANDOFF §7 «الحفظ التلقائي للتقدّم وموضع القراءة؛ مزامنة اختيارية»); the sync service pushes
 * the same records to Supabase when the user signs in and keeps sync on.
 */
import { useSyncExternalStore } from 'react';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Lesson } from '@/data/content';
import { addToLog, type QuranEntry, type QuranLog } from '@/features/quran/log';
import { METHOD_LABEL, useConfig } from '@/state/config-store';
import { getCalendars } from 'expo-localization';
import { DAY, dayKey, startOfDay } from '@/utils/date';

import { safeStorage } from './storage';

export type FolderName = 'للحفظ' | 'للمراجعة';
export type HifzState = 0 | 1 | 2 | 3; // لم يبدأ · قيد الحفظ · محفوظة · تحتاج مراجعة
export type PlanMinutes = 5 | 15 | 30;

/** Settings keys and defaults (DEF in the prototype). */
export const SETTINGS_DEFAULTS = {
  lang: 'العربية',
  loc: 'تلقائي',
  calc: 'تلقائي حسب البلد',
  /** Prayer-time format; the default follows the phone (see settingDefault). */
  clock: '12 ساعة',
  asr: 'الجمهور',
  adj: '0',
  prayNotif: true,
  adhkarRem: true,
  reciter: 'Alafasy_128kbps',
  speed: '1×',
  autoNext: true,
  wifi: true,
  quality: 'عالية',
  goal: '15 دقيقة',
  dailyRem: true,
  nDaily: true,
  nQuiz: true,
  nSeason: true,
  nContent: false,
  sync: true,
  quranMode: 'صفحات المصحف',
  tafsir: 'تفسير السعدي',
  quranRem: true,
  muadhin: 'makkah',
};
export type SettingsValues = typeof SETTINGS_DEFAULTS;

/** Whether the phone is set to a 24-hour clock (unknown → 12-hour, the common Arabic convention). */
function phoneUses24h(): boolean {
  try {
    return getCalendars()[0]?.uses24hourClock === true;
  } catch {
    return false;
  }
}

/** Default for a setting the user has not changed: the console's published defaults first. */
export function settingDefault<K extends keyof SettingsValues>(k: K): SettingsValues[K] {
  const p = useConfig.getState().prayer;
  if (k === 'calc') return METHOD_LABEL[p.method] as SettingsValues[K];
  if (k === 'prayNotif') return p.notifications as SettingsValues[K];
  if (k === 'clock') return (phoneUses24h() ? '24 ساعة' : '12 ساعة') as SettingsValues[K];
  return SETTINGS_DEFAULTS[k];
}
export type SettingKey = keyof SettingsValues;

export interface SrsCard {
  id: string; // `${code}:${qid}`
  code: string;
  /** Stable question id (published lessons keep ids when questions are reordered). */
  qid: string;
  due: number; // epoch ms (start of day)
  interval: number; // days
  reviews: number;
}

export interface Download {
  id: string;
  name: string;
  kind: 'كتاب' | 'صوت' | 'سورة';
  mb: number;
  uri?: string;
  at: number;
}

export interface Note {
  id: string;
  text: string;
  at: number;
}

export interface PendingReport {
  localId: string;
  where: string;
  reason: string;
  note: string;
  at: number;
}

export interface DeviceEntry {
  id: string;
  title: string;
  os: string;
  type: string;
  lastActive: number;
}

export interface CoachState {
  rate: Record<number, 'ok' | 'again'>;
  reps: number;
  updatedAt: number;
}

export interface KhatmahPlan {
  id: string;
  title: string;
  targetDays: number;
  startPage: number;
  currentPage: number;
  startDate: string;
  targetDate: string;
}

export interface KhatmahRecord {
  id: string;
  title: string;
  targetDays: number;
  completedAt: string;
  durationDays: number;
}

export interface TasbeehState {
  daily: Record<string, number>;
  total: number;
  customDhikr: string[];
}

export interface Certificate {
  stage: number;
  code: string;
  name: string;
  issuedAt: string;
}

export interface LocationFix {
  lat: number;
  lon: number;
  label?: string;
  /** Country name and ISO code, when known (reverse geocoding or the chosen city). */
  country?: string;
  cc?: string;
  /** IANA time zone of the location; prayer times are calculated and shown in it. */
  tz?: string;
  at: number;
  source: 'gps' | 'manual';
}

export interface AppState {
  // ── appearance & profile
  dark: boolean | null; // null → follow the OS
  fs: 0 | 1 | 2;
  ls: 0 | 1 | 2;
  rt: 'default' | 'sepia';
  hc: boolean;
  rm: boolean | null; // null → follow the OS reduced-motion setting
  pname: string;
  onboarded: boolean;
  introSeen: boolean;
  sv: Partial<SettingsValues>;

  // ── academy
  passed: Record<string, { pct: number; at: number }>;
  attempts: Record<string, number>;
  lastAnswers: Record<string, number[]>;
  mast: Record<string, boolean>;
  pathDone: Record<string, boolean>;
  srs: Record<string, SrsCard>;

  // ── daily plan
  planMin: PlanMinutes;
  planDone: Record<string, Record<string, boolean>>;

  // ── prayer & adhkar
  prayed: Record<string, Record<string, boolean>>;
  /** Prayer log: when each prayer was ticked (epoch ms), by day key and prayer name. */
  prayedAt: Record<string, Record<string, number>>;
  adC: Record<string, Record<string, number>>;
  location: LocationFix | null;
  tasbeeh: TasbeehState;
  sunanDone: Record<string, Record<string, boolean>>;
  khatmah: { active: KhatmahPlan | null; history: KhatmahRecord[] };
  favDuas: string[];
  favNames: number[];

  // ── quran
  fold: Record<number, FolderName>;
  lastRead: { surah: number; ayah: number } | null;
  /** Explicit Quran reading bookmark (فاصل القراءة) */
  quranBookmark: { surah: number; ayah: number; page?: number; at: number } | null;
  /** Starred specific ayahs (المحفوظات - الآيات المميزة بنجمة) */
  starAyahs: Record<string, { surah: number; ayah: number; at: number }>;
  hifz: Record<number, HifzState>;
  coach: Record<number, CoachState>;
  /** Quran log: what was read and heard each day, per surah. */
  quranLog: QuranLog;

  // ── library
  downloads: Download[];
  queue: string[];
  lastBook: { id: string; title: string; page: number } | null;
  bookFs: 0 | 1 | 2;

  // ── notebook, quotes, reports
  notes: Note[];
  savedQ: string[];
  pendingReports: PendingReport[];
  certificates: Certificate[];
  devices: Record<string, DeviceEntry>;

  /** Account the personal data on this device belongs to (null = not yet signed in). Not synced. */
  owner: string | null;

  updatedAt: number;
}

interface Actions {
  set: (p: Partial<AppState>) => void;
  setSetting: <K extends SettingKey>(k: K, v: SettingsValues[K]) => void;
  setting: <K extends SettingKey>(k: K) => SettingsValues[K];

  recordQuiz: (lesson: Lesson, answers: number[]) => { pct: number; right: number; pass: boolean };
  rateSrs: (id: string, days: 1 | 3 | 7) => void;
        resetProgress: () => void;
  recordDevice: (entry: DeviceEntry) => void;
  removeDevice: (id: string) => void;

  togglePlan: (min: PlanMinutes, i: number) => void;
  /** Tick or untick a prayer for a day (today by default) and record when it was ticked. */
  togglePrayed: (name: string, day?: string) => void;
  /** Count one recitation of an adhkar item (keyed by category id + item id). */
  tapDhikr: (cat: string, itemId: string) => void;
  /** Reset counter for one recitation of an adhkar item. */
  resetDhikr: (cat: string, itemId: string) => void;
  /** Reset all adhkar counters for a category for today. */
  resetCategoryAdhkar: (cat: string) => void;
  tapTasbeeh: (dhikr?: string) => void;
  resetTasbeehDay: () => void;
  addCustomDhikr: (text: string) => void;
  toggleSunan: (id: string, day?: string) => void;
  startKhatmah: (targetDays: number, startPage?: number, title?: string) => void;
  updateKhatmahPage: (page: number) => void;
  completeKhatmah: () => void;
  toggleFavDua: (id: string) => void;
  toggleFavName: (num: number) => void;

  cycleFold: (surah: number) => void;
  setQuranBookmark: (surah: number, ayah: number, page?: number) => void;
  removeQuranBookmark: () => void;
  toggleStarAyah: (surah: number, ayah: number) => void;
  cycleHifz: (surah: number) => void;
  rateCoach: (surah: number, ayah: number, r: 'ok' | 'again') => void;
  bumpCoachReps: (surah: number) => void;
  /** Add to today's Quran log for a surah. */
  logQuran: (surah: number, e: QuranEntry) => void;

  addNote: (text: string) => void;
  deleteNote: (id: string) => void;
  toggleSavedQuote: (id: string) => void;
  toggleDownload: (d: Omit<Download, 'at'>) => void;
  removeDownload: (id: string) => void;
  toggleQueue: (name: string) => void;

  queueReport: (r: Omit<PendingReport, 'localId' | 'at'>) => PendingReport;
  clearReport: (localId: string) => void;
}

export const INITIAL_STATE: AppState = {
  dark: null,
  fs: 0,
  ls: 1,
  rt: 'default',
  hc: false,
  rm: null,
  pname: 'طالب العلم',
  onboarded: false,
  introSeen: false,
  sv: {},
  passed: {},
  attempts: {},
  lastAnswers: {},
  mast: {},
  pathDone: {},
  srs: {},
  planMin: 15,
  planDone: {},
  prayed: {},
  prayedAt: {},
  adC: {},
  location: null,
  tasbeeh: { daily: {}, total: 0, customDhikr: [] },
  sunanDone: {},
  khatmah: { active: null, history: [] },
  favDuas: [],
  favNames: [],
  fold: {},
  lastRead: null,
  quranBookmark: null,
  starAyahs: {},
  hifz: {},
  coach: {},
  quranLog: {},
  downloads: [],
  queue: [],
  lastBook: null,
  owner: null,
  bookFs: 0,
  notes: [],
  savedQ: [],
  pendingReports: [],
  certificates: [],
  devices: {},
  updatedAt: 0,
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function scoreQuiz(lesson: Lesson, answers: number[]) {
  const qs = lesson.quiz.questions;
  const right = qs.filter((q, i) => answers[i] === q.answer).length;
  const pct = Math.round((right / qs.length) * 100);
  return { right, wrong: qs.length - right, pct, pass: pct >= lesson.quiz.passPct };
}

export const useApp = create<AppState & Actions>()(
  persist(
    (set, get) => {
      const touch = (p: Partial<AppState>) => set({ ...p, updatedAt: Date.now() });
      return {
        ...INITIAL_STATE,
        set: (p) => touch(p),
        setSetting: (k, v) => touch({ sv: { ...get().sv, [k]: v } }),
        setting: (k) => {
          const v = get().sv[k];
          return (v === undefined ? settingDefault(k) : v) as SettingsValues[typeof k];
        },

        recordQuiz: (lesson, answers) => {
          const s = scoreQuiz(lesson, answers);
          const st = get();
          const passed = { ...st.passed };
          if (s.pass) {
            const prev = passed[lesson.code];
            passed[lesson.code] = { pct: Math.max(prev?.pct ?? 0, s.pct), at: prev?.at ?? Date.now() };
          }
          // Spaced review (HANDOFF §7): wrong answers come back after a day, then a week.
          const srs = { ...st.srs };
          const today = startOfDay();
          lesson.quiz.questions.forEach((q, i) => {
            const id = `${lesson.code}:${q.id}`;
            if (answers[i] !== q.answer && !srs[id]) {
              srs[id] = { id, code: lesson.code, qid: q.id, due: today + DAY, interval: 1, reviews: 0 };
            }
          });
          touch({
            passed,
            srs,
            attempts: { ...st.attempts, [lesson.code]: (st.attempts[lesson.code] ?? 0) + 1 },
            lastAnswers: { ...st.lastAnswers, [lesson.code]: answers },
          });
          return s;
        },
        rateSrs: (id, days) => {
          const card = get().srs[id];
          if (!card) return;
          touch({ srs: { ...get().srs, [id]: { ...card, interval: days, due: startOfDay() + days * DAY, reviews: card.reviews + 1 } } });
        },
        resetProgress: () =>
          touch({ passed: {}, attempts: {}, lastAnswers: {}, mast: {}, pathDone: {}, prayed: {}, prayedAt: {}, quranLog: {}, adC: {}, srs: {}, planDone: {} }),
        recordDevice: (entry) =>
          touch({ devices: { ...get().devices, [entry.id]: entry } }),
        removeDevice: (id) => {
          const copy = { ...get().devices };
          delete copy[id];
          touch({ devices: copy });
        },

        togglePlan: (min, i) => {
          const k = dayKey();
          const day = { ...(get().planDone[k] ?? {}) };
          day[`${min}:${i}`] = !day[`${min}:${i}`];
          touch({ planDone: { ...get().planDone, [k]: day } });
        },
        logQuran: (surah, e) => {
          if (!e.read?.length && !e.heard?.length && !e.seconds) return;
          touch({ quranLog: addToLog(get().quranLog, dayKey(), surah, e, Date.now()) });
        },
        togglePrayed: (name, dayArg) => {
          const k = dayArg ?? dayKey();
          const day = { ...(get().prayed[k] ?? {}) };
          const times = { ...(get().prayedAt[k] ?? {}) };
          day[name] = !day[name];
          if (day[name]) times[name] = Date.now();
          else delete times[name];
          touch({ prayed: { ...get().prayed, [k]: day }, prayedAt: { ...get().prayedAt, [k]: times } });
        },
        tapDhikr: (cat, itemId) => {
          const k = dayKey();
          const day = { ...(get().adC[k] ?? {}) };
          const key = `${cat}:${itemId}`;
          day[key] = (day[key] ?? 0) + 1;
          touch({ adC: { ...get().adC, [k]: day } });
        },
        resetDhikr: (cat, itemId) => {
          const k = dayKey();
          const day = { ...(get().adC[k] ?? {}) };
          const key = `${cat}:${itemId}`;
          delete day[key];
          touch({ adC: { ...get().adC, [k]: day } });
        },
        resetCategoryAdhkar: (cat) => {
          const k = dayKey();
          const day = { ...(get().adC[k] ?? {}) };
          for (const key of Object.keys(day)) {
            if (key.startsWith(`${cat}:`)) {
              delete day[key];
            }
          }
          touch({ adC: { ...get().adC, [k]: day } });
        },

        tapTasbeeh: () => {
          const k = dayKey();
          const prev = get().tasbeeh ?? { daily: {}, total: 0, customDhikr: [] };
          const daily = { ...(prev.daily ?? {}) };
          daily[k] = (daily[k] ?? 0) + 1;
          touch({
            tasbeeh: {
              ...prev,
              daily,
              total: (prev.total ?? 0) + 1,
            },
          });
        },
        resetTasbeehDay: () => {
          const k = dayKey();
          const prev = get().tasbeeh ?? { daily: {}, total: 0, customDhikr: [] };
          const daily = { ...(prev.daily ?? {}) };
          delete daily[k];
          touch({ tasbeeh: { ...prev, daily } });
        },
        addCustomDhikr: (text) => {
          const prev = get().tasbeeh ?? { daily: {}, total: 0, customDhikr: [] };
          const trimmed = text.trim();
          if (!trimmed || prev.customDhikr?.includes(trimmed)) return;
          touch({ tasbeeh: { ...prev, customDhikr: [...(prev.customDhikr ?? []), trimmed] } });
        },
        toggleSunan: (id, dayArg) => {
          const k = dayArg ?? dayKey();
          const day = { ...(get().sunanDone?.[k] ?? {}) };
          day[id] = !day[id];
          touch({ sunanDone: { ...(get().sunanDone ?? {}), [k]: day } });
        },
        startKhatmah: (targetDays, startPage = 1, title = 'ختمة القرآن الكريم') => {
          const now = new Date();
          const target = new Date(now.getTime() + targetDays * DAY);
          const active: KhatmahPlan = {
            id: uid(),
            title,
            targetDays,
            startPage,
            currentPage: startPage,
            startDate: dayKey(now),
            targetDate: dayKey(target),
          };
          touch({
            khatmah: {
              ...(get().khatmah ?? { active: null, history: [] }),
              active,
            },
          });
        },
        updateKhatmahPage: (page) => {
          const cur = get().khatmah?.active;
          if (!cur) return;
          const capped = Math.max(1, Math.min(604, page));
          touch({
            khatmah: {
              ...(get().khatmah ?? { active: null, history: [] }),
              active: { ...cur, currentPage: capped },
            },
          });
        },
        completeKhatmah: () => {
          const k = get().khatmah;
          if (!k?.active) return;
          const record: KhatmahRecord = {
            id: k.active.id,
            title: k.active.title,
            targetDays: k.active.targetDays,
            completedAt: dayKey(),
            durationDays: Math.max(1, Math.round((Date.now() - new Date(k.active.startDate).getTime()) / DAY)),
          };
          touch({
            khatmah: {
              active: null,
              history: [record, ...(k.history ?? [])],
            },
          });
        },
        toggleFavDua: (id) => {
          const prev = get().favDuas ?? [];
          touch({ favDuas: prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id] });
        },
        toggleFavName: (num) => {
          const prev = get().favNames ?? [];
          touch({ favNames: prev.includes(num) ? prev.filter((x) => x !== num) : [...prev, num] });
        },

        cycleFold: (n) => {
          const fold = { ...get().fold };
          const f = fold[n];
          if (!f) fold[n] = 'للحفظ';
          else if (f === 'للحفظ') fold[n] = 'للمراجعة';
          else delete fold[n];
          touch({ fold });
        },
        setQuranBookmark: (surah, ayah, page) => {
          touch({ quranBookmark: { surah, ayah, page, at: Date.now() }, lastRead: { surah, ayah } });
        },
        removeQuranBookmark: () => {
          touch({ quranBookmark: null });
        },
        toggleStarAyah: (surah, ayah) => {
          const key = `${surah}:${ayah}`;
          const next = { ...get().starAyahs };
          if (next[key]) {
            delete next[key];
          } else {
            next[key] = { surah, ayah, at: Date.now() };
          }
          touch({ starAyahs: next });
        },
        cycleHifz: (n) => {
          const v = (get().hifz[n] ?? 0) as number;
          touch({ hifz: { ...get().hifz, [n]: ((v + 1) % 4) as HifzState } });
        },
        rateCoach: (surah, ayah, r) => {
          const c = get().coach[surah] ?? { rate: {}, reps: 0, updatedAt: 0 };
          touch({ coach: { ...get().coach, [surah]: { ...c, rate: { ...c.rate, [ayah]: r }, updatedAt: Date.now() } } });
        },
        bumpCoachReps: (surah) => {
          const c = get().coach[surah] ?? { rate: {}, reps: 0, updatedAt: 0 };
          touch({ coach: { ...get().coach, [surah]: { ...c, reps: (c.reps + 1) % 11, updatedAt: Date.now() } } });
        },

        addNote: (text) => {
          const x = text.trim();
          if (!x) return;
          touch({ notes: [{ id: uid(), text: x, at: Date.now() }, ...get().notes] });
        },
        deleteNote: (id) => touch({ notes: get().notes.filter((n) => n.id !== id) }),
        toggleSavedQuote: (id) => {
          const s = get().savedQ;
          touch({ savedQ: s.includes(id) ? s.filter((x) => x !== id) : [...s, id] });
        },
        toggleDownload: (d) => {
          const dl = get().downloads;
          touch({ downloads: dl.some((x) => x.id === d.id) ? dl.filter((x) => x.id !== d.id) : [...dl, { ...d, at: Date.now() }] });
        },
        removeDownload: (id) => touch({ downloads: get().downloads.filter((x) => x.id !== id) }),
        toggleQueue: (name) => {
          const q = get().queue;
          touch({ queue: q.includes(name) ? q.filter((x) => x !== name) : [...q, name] });
        },

        queueReport: (r) => {
          const rep = { ...r, localId: uid(), at: Date.now() };
          touch({ pendingReports: [...get().pendingReports, rep] });
          return rep;
        },
        clearReport: (localId) => touch({ pendingReports: get().pendingReports.filter((r) => r.localId !== localId) }),
      };
    },
    {
      name: 'baseerah.app.v1',
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      version: 2,
      // v2: content now comes from the console. Progress, review cards and adhkar counters recorded
      // against the old bundled placeholder lessons are not real progress, so they are cleared.
      migrate: (persisted, version) => {
        const st = (persisted ?? {}) as Partial<AppState>;
        if (version < 2) return { ...st, passed: {}, attempts: {}, lastAnswers: {}, srs: {}, adC: {}, savedQ: [] } as AppState;
        return st as AppState;
      },
      partialize: (s) => {
        const out: Partial<AppState> = {};
        (Object.keys(INITIAL_STATE) as (keyof AppState)[]).forEach((k) => {
          (out as Record<string, unknown>)[k] = s[k];
        });
        return out as AppState;
      },
    },
  ),
);

// ── Derived academy selectors ──────────────────────────────────────────────

/** A lesson is unlocked when it is the first of its subject or the previous one passed (HANDOFF §7). */
export function lessonStates(lessons: Lesson[], passed: AppState['passed']) {
  return lessons.map((l, i) => {
    const prevPassed = i === 0 || !!passed[lessons[i - 1].code];
    const state: 'done' | 'current' | 'locked' = passed[l.code] ? 'done' : prevPassed ? 'current' : 'locked';
    return { lesson: l, state };
  });
}

/** Number of consecutive passed lessons from the start (the prototype's `done`). */
export function doneCount(lessons: Lesson[], passed: AppState['passed']): number {
  let n = 0;
  for (const l of lessons) {
    if (!passed[l.code]) break;
    n++;
  }
  return n;
}

export function totalPassed(lessons: Lesson[], passed: AppState['passed']): number {
  return lessons.filter((l) => passed[l.code]).length;
}

export function dueSrsCards(srs: AppState['srs'], now = Date.now()): SrsCard[] {
  return Object.values(srs)
    .filter((c) => c.due <= now)
    .sort((a, b) => a.due - b.due);
}

/** True once persisted state has been restored (reactive, unlike `persist.hasHydrated()`). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useApp.persist.onFinishHydration(cb),
    () => useApp.persist.hasHydrated(),
    () => false,
  );
}
