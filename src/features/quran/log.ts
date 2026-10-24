/** Quran reading log helpers (pure; unit-tested in tests/unit/domain.test.ts). */
import { addDays, dayKey } from '@/utils/date';

/** One surah on one day: ayahs read on screen, ayahs listened to, seconds spent in the reader. */
export interface QuranDay {
  a: number[];
  l: number[];
  s: number;
  at: number;
}

/** Day key → surah number → what was read that day. */
export type QuranLog = Record<string, Record<number, QuranDay>>;

export interface QuranEntry {
  read?: number[];
  heard?: number[];
  seconds?: number;
}

/** Sorted union of two ayah lists. */
export function mergeAyahs(a: number[], b: number[]): number[] {
  return [...new Set([...a, ...b])].sort((x, y) => x - y);
}

/** Record reading for a surah on a day (returns a new log). */
export function addToLog(log: QuranLog, day: string, surah: number, e: QuranEntry, at: number): QuranLog {
  const d = log[day] ?? {};
  const cur = d[surah] ?? { a: [], l: [], s: 0, at };
  const next: QuranDay = {
    a: mergeAyahs(cur.a, e.read ?? []),
    l: mergeAyahs(cur.l, e.heard ?? []),
    s: cur.s + Math.max(0, Math.round(e.seconds ?? 0)),
    at,
  };
  return { ...log, [day]: { ...d, [surah]: next } };
}

/**
 * Merge two devices' logs: every day and surah from both; ayahs are the union and the time is the
 * larger of the two (the same session can be on both copies, so adding would count it twice).
 */
export function mergeQuranLogs(x: QuranLog = {}, y: QuranLog = {}): QuranLog {
  const out: QuranLog = { ...x };
  for (const [day, surahs] of Object.entries(y)) {
    const d = { ...(out[day] ?? {}) };
    for (const [k, v] of Object.entries(surahs)) {
      const n = Number(k);
      const c = d[n];
      d[n] = c ? { a: mergeAyahs(c.a, v.a), l: mergeAyahs(c.l, v.l), s: Math.max(c.s, v.s), at: Math.max(c.at, v.at) } : v;
    }
    out[day] = d;
  }
  return out;
}

/** «1–7، 10، 12–15» */
export function ayahRanges(a: number[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < a.length) {
    let j = i;
    while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++;
    out.push(i === j ? String(a[i]) : `${a[i]}–${a[j]}`);
    i = j + 1;
  }
  return out.join('، ');
}

/** Distinct ayahs (read or heard), seconds and surahs for a day. */
export function dayTotals(log: QuranLog, key: string): { ayahs: number; seconds: number; surahs: number } {
  const d = Object.values(log[key] ?? {});
  return {
    ayahs: d.reduce((n, v) => n + mergeAyahs(v.a, v.l).length, 0),
    seconds: d.reduce((n, v) => n + v.s, 0),
    surahs: d.length,
  };
}

/** Consecutive days with some reading, ending today — or yesterday while today has none yet. */
export function readingStreak(log: QuranLog, now: Date): number {
  const has = (d: Date) => dayTotals(log, dayKey(d)).ayahs > 0;
  let i = has(now) ? 0 : 1;
  let n = 0;
  while (has(addDays(now, -i))) {
    n++;
    i++;
  }
  return n;
}

/** «12 د» / «1 س 5 د» / «أقل من دقيقة» */
export function durationLabel(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 1) return 'أقل من دقيقة';
  if (m < 60) return `${m} د`;
  return `${Math.floor(m / 60)} س ${m % 60} د`;
}
