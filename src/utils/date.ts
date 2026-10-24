const DAY = 24 * 60 * 60 * 1000;

/** Local calendar day key, e.g. 2026-10-20. Used for per-day prayer marks, adhkar counters and plans. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Day keys for the last `n` days, today first. */
export function lastDays(n: number, now: Date): string[] {
  return Array.from({ length: n }, (_, i) => dayKey(addDays(now, -i)));
}

export function startOfDay(d: Date = new Date()): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export { DAY };

/** "HH:MM" in 24h with Latin digits (the design shows times LTR, Latin digits). */
export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Arabic plural-aware duration such as «بعد 1:24». */
export function untilLabel(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `بعد ${h}:${String(m).padStart(2, '0')}`;
}

export function mmss(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
