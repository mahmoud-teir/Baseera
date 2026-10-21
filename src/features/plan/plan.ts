import { PLAN_TEMPLATES } from '@/data/structural';
import type { AppState, PlanMinutes } from '@/state/app-store';
import { addDays, dayKey } from '@/utils/date';

/** A day counts towards the streak when every task of any plan length was completed that day. */
export function dayComplete(day: Record<string, boolean> | undefined): boolean {
  if (!day) return false;
  return ([5, 15, 30] as PlanMinutes[]).some((m) => PLAN_TEMPLATES[m].every((_, i) => day[`${m}:${i}`]));
}

/** Consecutive completed days ending today (or yesterday, if today is still in progress). */
export function planStreak(planDone: AppState['planDone'], now = new Date()): number {
  let d = dayComplete(planDone[dayKey(now)]) ? now : addDays(now, -1);
  let n = 0;
  while (dayComplete(planDone[dayKey(d)])) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
