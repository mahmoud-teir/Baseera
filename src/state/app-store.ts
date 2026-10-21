/**
 * Persisted, local-first application state. Everything the user does is saved on the device
 * (HANDOFF §7 «الحفظ التلقائي للتقدّم وموضع القراءة؛ مزامنة اختيارية»); the sync service pushes
 * the same records to Supabase when the user signs in and keeps sync on.
 */
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Lesson } from '@/data/content';
import { METHOD_LABEL, useConfig } from '@/state/config-store';
import { DAY, dayKey, startOfDay } from '@/utils/date';

import { safeStorage } from './storage';

export type FolderName = 'للحفظ' | 'للمراجعة';
export type HifzState = 0 | 1 | 2 | 3; // لم يبدأ · قيد الحفظ · محفوظة · تحتاج مراجعة
export type PlanMinutes = 5 | 15 | 30;

/** Settings keys and defaults (DEF in the prototype). */
export const SETTINGS_DEFAULTS = {
  lang: 'العربية',
  loc: 'تلقائي',
  calc: 'رابطة العالم الإسلامي',
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
};
export type SettingsValues = typeof SETTINGS_DEFAULTS;

/** Default for a setting the user has not changed: the console's published defaults first. */
export function settingDefault<K extends keyof SettingsValues>(k: K): SettingsValues[K] {
  const p = useConfig.getState().prayer;
  if (k === 'calc') return METHOD_LABEL[p.method] as SettingsValues[K];
  if (k === 'prayNotif') return p.notifications as SettingsValues[K];
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

export interface CoachState {
  rate: Record<number, 'ok' | 'again'>;
  reps: number;
  updatedAt: number;
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
  adC: Record<string, Record<string, number>>;
  location: LocationFix | null;

  // ── quran
  fold: Record<number, FolderName>;
  lastRead: { surah: number; ayah: number } | null;
  hifz: Record<number, HifzState>;
  coach: Record<number, CoachState>;

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

  updatedAt: number;
}

interface Actions {
  set: (p: Partial<AppState>) => void;
  setSetting: <K extends SettingKey>(k: K, v: SettingsValues[K]) => void;
  setting: <K extends SettingKey>(k: K) => SettingsValues[K];

  recordQuiz: (lesson: Lesson, answers: number[]) => { pct: number; right: number; pass: boolean };
  rateSrs: (id: string, days: 1 | 3 | 7) => void;
  resetProgress: () => void;

  togglePlan: (min: PlanMinutes, i: number) => void;
  togglePrayed: (name: string) => void;
  /** Count one recitation of an adhkar item (keyed by category id + item id). */
  tapDhikr: (cat: string, itemId: string) => void;

  cycleFold: (surah: number) => void;
  cycleHifz: (surah: number) => void;
  rateCoach: (surah: number, ayah: number, r: 'ok' | 'again') => void;
  bumpCoachReps: (surah: number) => void;

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
  adC: {},
  location: null,
  fold: {},
  lastRead: null,
  hifz: {},
  coach: {},
  downloads: [],
  queue: [],
  lastBook: null,
  bookFs: 0,
  notes: [],
  savedQ: [],
  pendingReports: [],
  certificates: [],
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
          touch({ passed: {}, attempts: {}, lastAnswers: {}, mast: {}, pathDone: {}, prayed: {}, adC: {}, srs: {}, planDone: {} }),

        togglePlan: (min, i) => {
          const k = dayKey();
          const day = { ...(get().planDone[k] ?? {}) };
          day[`${min}:${i}`] = !day[`${min}:${i}`];
          touch({ planDone: { ...get().planDone, [k]: day } });
        },
        togglePrayed: (name) => {
          const k = dayKey();
          const day = { ...(get().prayed[k] ?? {}) };
          day[name] = !day[name];
          touch({ prayed: { ...get().prayed, [k]: day } });
        },
        tapDhikr: (cat, itemId) => {
          const k = dayKey();
          const day = { ...(get().adC[k] ?? {}) };
          const key = `${cat}:${itemId}`;
          day[key] = (day[key] ?? 0) + 1;
          touch({ adC: { ...get().adC, [k]: day } });
        },

        cycleFold: (n) => {
          const fold = { ...get().fold };
          const f = fold[n];
          if (!f) fold[n] = 'للحفظ';
          else if (f === 'للحفظ') fold[n] = 'للمراجعة';
          else delete fold[n];
          touch({ fold });
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
