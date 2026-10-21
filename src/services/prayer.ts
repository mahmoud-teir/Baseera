/**
 * Prayer times — HANDOFF §7: computed from the user's location (with permission) + calculation
 * method (أم القرى، رابطة العالم، المصرية، كراتشي، أمريكا الشمالية) + Asr school (جمهور/حنفي)
 * + a ±2 minute adjustment. Uses the `adhan` astronomical library; no times are shown without a
 * location.
 */
import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes, type CalculationParameters } from 'adhan';

import type { SettingsValues } from '@/state/app-store';
import { useConfig, type PrayerConfig } from '@/state/config-store';

export const PRAYER_NAMES = ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

const METHODS: Record<string, () => CalculationParameters> = {
  'أم القرى': () => CalculationMethod.UmmAlQura(),
  'رابطة العالم الإسلامي': () => CalculationMethod.MuslimWorldLeague(),
  'الهيئة المصرية': () => CalculationMethod.Egyptian(),
  كراتشي: () => CalculationMethod.Karachi(),
  'أمريكا الشمالية': () => CalculationMethod.NorthAmerica(),
};

export function parseAdjust(v: string): number {
  return Number(v.replace('−', '-').replace('+', '')) || 0;
}

export function paramsFor(settings: Pick<SettingsValues, 'calc' | 'asr' | 'adj'>): CalculationParameters {
  const p = (METHODS[settings.calc] ?? METHODS['رابطة العالم الإسلامي'])();
  p.madhab = settings.asr === 'الحنفي' ? Madhab.Hanafi : Madhab.Shafi;
  const adj = parseAdjust(settings.adj);
  if (adj) {
    p.adjustments = { fajr: adj, sunrise: adj, dhuhr: adj, asr: adj, maghrib: adj, isha: adj };
  }
  return p;
}

export interface DayTimes {
  date: Date;
  times: { name: PrayerName; at: Date }[];
}

/**
 * Minutes the clock is ahead of standard time on `date` (60 during daylight saving, else 0).
 * Standard time is the larger of the January and July UTC offsets.
 */
export function dstMinutes(date: Date): number {
  const y = date.getFullYear();
  const std = Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset());
  return std - date.getTimezoneOffset();
}

export function prayerTimesFor(
  lat: number,
  lon: number,
  date: Date,
  settings: Pick<SettingsValues, 'calc' | 'asr' | 'adj'>,
  cfg: Pick<PrayerConfig, 'highLatitude' | 'dst'> = useConfig.getState().prayer,
): DayTimes {
  const coords = new Coordinates(lat, lon);
  const params = paramsFor(settings);
  // Console «High-latitude rule»: adhan's recommended rule (seventh of the night above 48°).
  if (cfg.highLatitude) params.highLatitudeRule = HighLatitudeRule.recommended(coords);
  const pt = new PrayerTimes(coords, date, params);
  // Console «Follow daylight saving» off: show times on standard time, as timetables in places that ignore DST do.
  const shift = cfg.dst ? 0 : -dstMinutes(date) * 60_000;
  const at = (d: Date) => (shift ? new Date(d.getTime() + shift) : d);
  return {
    date,
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
export function nextPrayer(lat: number, lon: number, now: Date, settings: Pick<SettingsValues, 'calc' | 'asr' | 'adj'>) {
  const today = prayerTimesFor(lat, lon, now, settings).times.filter((x) => x.name !== 'الشروق');
  const n = today.find((x) => x.at.getTime() > now.getTime());
  if (n) return n;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return prayerTimesFor(lat, lon, tomorrow, settings).times[0];
}
