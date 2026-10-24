/**
 * Prayer times — HANDOFF §7: computed from the location (with permission, or a chosen city) +
 * calculation method + Asr school (جمهور/حنفي) + a ±2 minute adjustment, with the `adhan`
 * astronomical library. No times are shown without a location.
 *
 * Accuracy rules:
 * - Everything is computed and displayed in the LOCATION's time zone (a chosen city keeps its own
 *   zone whatever the phone's zone is), and the calculation day is that zone's calendar day.
 * - «تلقائي حسب البلد» picks the method commonly used officially in the location's country
 *   (praytimes.org / adhan guidance) and the screen names the method actually used.
 * - Umm al-Qura: Isha is 120 minutes after Maghrib in Ramadan (90 otherwise).
 */
import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes, type CalculationParameters } from 'adhan';

import type { SettingsValues } from '@/state/app-store';
import { useConfig, type PrayerConfig } from '@/state/config-store';

import { toHijri } from './hijri';

export const PRAYER_NAMES = ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

export const AUTO_METHOD = 'تلقائي حسب البلد';

const METHODS: Record<string, () => CalculationParameters> = {
  'أم القرى': () => CalculationMethod.UmmAlQura(),
  'رابطة العالم الإسلامي': () => CalculationMethod.MuslimWorldLeague(),
  'الهيئة المصرية': () => CalculationMethod.Egyptian(),
  كراتشي: () => CalculationMethod.Karachi(),
  'أمريكا الشمالية': () => CalculationMethod.NorthAmerica(),
  'دبي': () => CalculationMethod.Dubai(),
  'قطر': () => CalculationMethod.Qatar(),
  'الكويت': () => CalculationMethod.Kuwait(),
  'سنغافورة': () => CalculationMethod.Singapore(),
  'تركيا (ديانت)': () => CalculationMethod.Turkey(),
  'طهران': () => CalculationMethod.Tehran(),
};

/** Methods offered in Settings (automatic first). */
export const METHOD_OPTIONS = [AUTO_METHOD, ...Object.keys(METHODS)];

/** Country (ISO 3166-1 alpha-2) → method commonly used for its official timetables. */
const COUNTRY_METHOD: Record<string, string> = {
  SA: 'أم القرى', YE: 'أم القرى', OM: 'أم القرى', BH: 'أم القرى',
  AE: 'دبي', QA: 'قطر', KW: 'الكويت',
  EG: 'الهيئة المصرية', SD: 'الهيئة المصرية', LY: 'الهيئة المصرية', SY: 'الهيئة المصرية', LB: 'الهيئة المصرية',
  IQ: 'الهيئة المصرية', PS: 'الهيئة المصرية', JO: 'الهيئة المصرية', SO: 'الهيئة المصرية', DJ: 'الهيئة المصرية', ER: 'الهيئة المصرية',
  PK: 'كراتشي', IN: 'كراتشي', BD: 'كراتشي', AF: 'كراتشي',
  IR: 'طهران', TR: 'تركيا (ديانت)',
  SG: 'سنغافورة', MY: 'سنغافورة', ID: 'سنغافورة', BN: 'سنغافورة',
  US: 'أمريكا الشمالية', CA: 'أمريكا الشمالية',
};

/** The method actually used: the chosen one, or the country's when «automatic». */
export function resolveMethod(calc: string, country?: string): string {
  if (calc !== AUTO_METHOD && METHODS[calc]) return calc;
  return (country && COUNTRY_METHOD[country.toUpperCase()]) || 'رابطة العالم الإسلامي';
}

export function parseAdjust(v: string): number {
  return Number(v.replace('−', '-').replace('+', '')) || 0;
}

export function paramsFor(settings: Pick<SettingsValues, 'calc' | 'asr' | 'adj'>, country?: string): CalculationParameters {
  const p = METHODS[resolveMethod(settings.calc, country)]();
  p.madhab = settings.asr === 'الحنفي' ? Madhab.Hanafi : Madhab.Shafi;
  const adj = parseAdjust(settings.adj);
  if (adj) {
    p.adjustments = { fajr: adj, sunrise: adj, dhuhr: adj, asr: adj, maghrib: adj, isha: adj };
  }
  return p;
}

// ── Time zones ──────────────────────────────────────────────────────────────

/** The phone's own IANA time zone (used for GPS locations). */
export function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
/** Wall-clock parts of `d` in time zone `tz` (device zone when undefined). */
export function zonedParts(d: Date, tz?: string): { y: number; m: number; day: number; h: number; min: number } {
  if (!tz) return { y: d.getFullYear(), m: d.getMonth() + 1, day: d.getDate(), h: d.getHours(), min: d.getMinutes() };
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    fmtCache.set(tz, f);
  }
  const get = (type: string) => Number(f!.formatToParts(d).find((p) => p.type === type)?.value);
  return { y: get('year'), m: get('month'), day: get('day'), h: get('hour') % 24, min: get('minute') };
}

/** UTC offset of time zone `tz` at instant `d`, in minutes (east positive). */
function offsetMinutes(d: Date, tz?: string): number {
  if (!tz) return -d.getTimezoneOffset();
  const p = zonedParts(d, tz);
  const asUtc = Date.UTC(p.y, p.m - 1, p.day, p.h, p.min);
  return Math.round((asUtc - Math.floor(d.getTime() / 60000) * 60000) / 60000);
}

/**
 * Minutes the clock is ahead of standard time on `date` in `tz` (60 during daylight saving, else 0).
 * Standard time is the smaller of the January and July UTC offsets.
 */
export function dstMinutes(date: Date, tz?: string): number {
  const y = date.getFullYear();
  const std = Math.min(offsetMinutes(new Date(Date.UTC(y, 0, 1, 12)), tz), offsetMinutes(new Date(Date.UTC(y, 6, 1, 12)), tz));
  return offsetMinutes(date, tz) - std;
}

/** «05:12» (24-hour) or «5:12 ص» / «5:12 م» (12-hour), in the location's time zone. */
export function formatPrayerTime(d: Date, tz: string | undefined, h12: boolean): string {
  const { h, min } = zonedParts(d, tz);
  const mm = String(min).padStart(2, '0');
  if (!h12) return `${String(h).padStart(2, '0')}:${mm}`;
  return `${h % 12 || 12}:${mm} ${h < 12 ? 'ص' : 'م'}`;
}

/** Whether a formatted time should render as a left-to-right island (24-hour digits only). */
export const isLtrTime = (s: string) => !/[صم]/.test(s);

// ── Times ───────────────────────────────────────────────────────────────────

/** Where the times are for: coordinates plus, when known, time zone and country. */
export interface PrayerPlace {
  tz?: string;
  country?: string;
}

export interface DayTimes {
  date: Date;
  method: string;
  times: { name: PrayerName; at: Date }[];
}

export function prayerTimesFor(
  lat: number,
  lon: number,
  date: Date,
  settings: Pick<SettingsValues, 'calc' | 'asr' | 'adj'>,
  cfg: Pick<PrayerConfig, 'highLatitude' | 'dst'> = useConfig.getState().prayer,
  place: PrayerPlace = {},
): DayTimes {
  const coords = new Coordinates(lat, lon);
  const method = resolveMethod(settings.calc, place.country);
  const params = paramsFor(settings, place.country);
  // Calculate for the location's calendar day (not the phone's, which can differ near midnight).
  const z = zonedParts(date, place.tz);
  const day = new Date(z.y, z.m - 1, z.day, 12);
  // Umm al-Qura: Isha 120 minutes after Maghrib during Ramadan.
  if (method === 'أم القرى' && toHijri(day).hm === 9) params.ishaInterval = 120;
  // Console «High-latitude rule»: adhan's recommended rule (seventh of the night above 48°).
  if (cfg.highLatitude) params.highLatitudeRule = HighLatitudeRule.recommended(coords);
  const pt = new PrayerTimes(coords, day, params);
  // Console «Follow daylight saving» off: show times on standard time, as timetables in places that ignore DST do.
  const shift = cfg.dst ? 0 : -dstMinutes(date, place.tz) * 60_000;
  const at = (d: Date) => (shift ? new Date(d.getTime() + shift) : d);
  return {
    date,
    method,
    times: [
      { name: 'الفجر', at: at(pt.fajr) },
      { name: 'الشروق', at: at(pt.sunrise) },
      { name: 'الظهر', at: at(pt.dhuhr) },
      { name: 'العصر', at: at(pt.asr) },
      { name: 'المغرب', at: at(pt.maghrib) },
      { name: 'العشاء', at: at(pt.isha) },
    ],
  };
}

/** Next obligatory prayer after `now` (sunrise is listed but is not a prayer). */
export function nextPrayer(lat: number, lon: number, now: Date, settings: Pick<SettingsValues, 'calc' | 'asr' | 'adj'>, place: PrayerPlace = {}) {
  const cfg = useConfig.getState().prayer;
  const today = prayerTimesFor(lat, lon, now, settings, cfg, place).times.filter((x) => x.name !== 'الشروق');
  const n = today.find((x) => x.at.getTime() > now.getTime());
  if (n) return n;
  return prayerTimesFor(lat, lon, new Date(now.getTime() + 24 * 3600_000), settings, cfg, place).times[0];
}
