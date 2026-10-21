/**
 * Hijri (Umm al-Qura) calendar. Primary source: the platform's ICU `Intl` islamic-umalqura
 * calendar (browsers, iOS and Android all ship it). Fallback: @umalqura/core tables.
 * HANDOFF §7 notes the Hijri date needs an approved source (calculation or sighting); the
 * UI labels it «حسب تقويم أم القرى».
 */
import umalqura from '@umalqura/core';

import { HIJRI_MONTHS } from '@/data/structural';
import { useConfig } from '@/state/config-store';

export interface HDate {
  hy: number;
  hm: number; // 1–12
  hd: number;
}

let fmt: Intl.DateTimeFormat | null | undefined;
function intlFormatter(): Intl.DateTimeFormat | null {
  if (fmt !== undefined) return fmt;
  try {
    const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
    const ok = f.resolvedOptions().calendar === 'islamic-umalqura' && typeof f.formatToParts === 'function';
    fmt = ok ? f : null;
  } catch {
    fmt = null;
  }
  return fmt;
}

/**
 * Convert a local calendar day to Hijri. `adj` shifts the result by whole days (−2…+2), set by
 * the console's «Hijri date adjustment» to follow a local moon-sighting announcement.
 */
export function toHijri(d: Date, adj: number = useConfig.getState().prayer.hijriAdj): HDate {
  const utcNoon = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + adj, 12));
  const f = intlFormatter();
  if (f) {
    try {
      const parts = f.formatToParts(utcNoon);
      const get = (k: string) => parseInt(parts.find((p) => p.type === k)?.value ?? '', 10);
      const hy = get('year') || get('relatedYear');
      const hm = get('month');
      const hd = get('day');
      if (hy && hm && hd) return { hy, hm, hd };
    } catch {
      // fall back below
    }
  }
  const r = umalqura.$.gregorianToHijri(new Date(d.getFullYear(), d.getMonth(), d.getDate() + adj, 12));
  return { hy: r.hy, hm: r.hm, hd: r.hd };
}

export function hijriLabel(h: HDate): string {
  return `${h.hd} ${HIJRI_MONTHS[h.hm - 1]} ${h.hy} هـ`;
}

export interface HijriMonth {
  hy: number;
  hm: number;
  days: number;
  /** Gregorian date of day 1. */
  start: Date;
  /** Weekday offset for a Saturday-first grid (0 = Saturday). */
  offset: number;
}

/** Find the Gregorian start and length of a Hijri month by walking days from an anchor. */
export function hijriMonth(hy: number, hm: number, anchor = new Date(), adj: number = useConfig.getState().prayer.hijriAdj): HijriMonth {
  // Estimate the Gregorian date from the month difference to the anchor (≈29.53 days/month).
  const a = toHijri(anchor, adj);
  const diffMonths = (hy - a.hy) * 12 + (hm - a.hm);
  let probe = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + Math.round(diffMonths * 29.5306) - (a.hd - 15), 12);
  // Walk to a day inside the target month.
  for (let i = 0; i < 40; i++) {
    const h = toHijri(probe, adj);
    const cmp = (h.hy - hy) * 12 + (h.hm - hm);
    if (cmp === 0) break;
    probe = new Date(probe.getFullYear(), probe.getMonth(), probe.getDate() + (cmp > 0 ? -1 : 1), 12);
  }
  // Walk back to day 1.
  let start = probe;
  for (let i = 0; i < 31; i++) {
    const prev = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1, 12);
    if (toHijri(prev, adj).hm !== hm) break;
    start = prev;
  }
  let days = 29;
  const d30 = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 29, 12);
  if (toHijri(d30, adj).hm === hm) days = 30;
  // JS getDay: 0 = Sunday … 6 = Saturday → Saturday-first index.
  const offset = (start.getDay() + 1) % 7;
  return { hy, hm, days, start, offset };
}

export function shiftMonth(hy: number, hm: number, delta: number): { hy: number; hm: number } {
  const idx = hy * 12 + (hm - 1) + delta;
  return { hy: Math.floor(idx / 12), hm: (idx % 12) + 1 };
}
