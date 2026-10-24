/** Prayer log helpers (pure; unit-tested in tests/unit/domain.test.ts). */
import { addDays, dayKey } from '@/utils/date';

export { lastDays } from '@/utils/date';

/** The five obligatory prayers, in order (sunrise is not logged). */
export const LOG_PRAYERS = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'] as const;

type Prayed = Record<string, Record<string, boolean>>;

/** Number of the five prayers ticked on a day. */
export function doneOn(prayed: Prayed, key: string): number {
  const d = prayed[key] ?? {};
  return LOG_PRAYERS.filter((p) => d[p]).length;
}

/** Prayers ticked over the given days. */
export function doneOver(prayed: Prayed, keys: string[]): number {
  return keys.reduce((a, k) => a + doneOn(prayed, k), 0);
}

/**
 * Consecutive days with all five prayers ticked, ending today — or yesterday, while today is still
 * in progress (an unfinished today does not break the streak).
 */
export function fullDayStreak(prayed: Prayed, now: Date): number {
  let i = doneOn(prayed, dayKey(now)) === LOG_PRAYERS.length ? 0 : 1;
  let n = 0;
  while (doneOn(prayed, dayKey(addDays(now, -i))) === LOG_PRAYERS.length) {
    n++;
    i++;
  }
  return n;
}
