import { useEffect, useMemo, useState } from 'react';

import { useMounted } from '@/utils/useMounted';

import { hijriLabel, toHijri } from '@/services/hijri';
import { placeOf } from '@/services/location';
import { formatPrayerTime, nextPrayer, prayerTimesFor, type PrayerName } from '@/services/prayer';
import { useApp } from '@/state/app-store';
import { useConfig } from '@/state/config-store';
import { dayKey, untilLabel } from '@/utils/date';

/** Ticks every 30s so times stay fresh. `null` until mounted (time is client-only). */
export function useMinuteClock(): Date | null {
  const mounted = useMounted();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return mounted ? now : null;
}

/** High-frequency 1-second clock for precision countdowns with seconds. */
export function useSecondClock(): Date | null {
  const mounted = useMounted();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return mounted ? now : null;
}

export function useHijriToday(now: Date | null) {
  const adj = useConfig((s) => s.prayer.hijriAdj);
  return useMemo(() => (now ? hijriLabel(toHijri(now, adj)) : ''), [now, adj]);
}

export interface PrayerCountdown {
  secondsLeft: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string; // e.g. "02:14:35"
  arabic: string; // e.g. "2 س و 14 د و 35 ث"
  progressPct: number; // 0–100 elapsed of the current interval
}

export interface NextPrayerData {
  name: PrayerName;
  time: string;
  at: Date;
  left: string;
  countdown: PrayerCountdown;
}

export interface PrevPrayerData {
  name: PrayerName;
  time: string;
  at: Date;
}

export function usePrayer(options?: { liveSeconds?: boolean }) {
  const live = options?.liveSeconds ?? true;
  const minuteClock = useMinuteClock();
  const secondClock = useSecondClock();
  const now = live ? (secondClock ?? minuteClock) : minuteClock;

  const loc = useApp((s) => s.location);
  const sv = useApp((s) => s.sv);
  const cfg = useConfig((s) => s.prayer);
  const setting = useApp((s) => s.setting);
  const prayedAll = useApp((s) => s.prayed);
  const prayed = now ? (prayedAll[dayKey(now)] ?? {}) : {};
  const hijriToday = useHijriToday(now);

  // Compute daily schedule only when location, minute clock, or settings change (not every second)
  const baseData = useMemo(() => {
    if (!loc || !minuteClock) return null;
    const settings = { calc: setting('calc'), asr: setting('asr'), adj: setting('adj') };
    const place = placeOf(loc);
    const h12 = setting('clock') === '12 ساعة';
    const { times, method } = prayerTimesFor(loc.lat, loc.lon, minuteClock, settings, cfg, place);
    const nx = nextPrayer(loc.lat, loc.lon, minuteClock, settings, place);

    // Identify previous obligatory prayer for progress calculation
    const obligatory = times.filter((x) => x.name !== 'الشروق');
    const pastPrayers = obligatory.filter((x) => x.at.getTime() <= minuteClock.getTime());
    const prev = pastPrayers.length > 0 ? pastPrayers[pastPrayers.length - 1] : null;

    return {
      method,
      tz: place.tz,
      times: times.map((x) => ({ name: x.name, time: formatPrayerTime(x.at, place.tz, h12), at: x.at })),
      rawNext: nx,
      rawPrev: prev,
      h12,
      place,
    };
    // sv and the console defaults (cfg) drive `setting` and prayerTimesFor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc, minuteClock, sv, cfg]);

  // Compute live seconds countdown and interval progress
  const countdownData = useMemo(() => {
    if (!baseData || !now) return null;
    const { rawNext, rawPrev, place, h12 } = baseData;

    const msLeft = Math.max(0, rawNext.at.getTime() - now.getTime());
    const totalSec = Math.floor(msLeft / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const arabic = hours > 0 ? `${hours} س و ${minutes} د و ${seconds} ث` : `${minutes} د و ${seconds} ث`;

    // Calculate elapsed progress percentage between previous and next prayer
    const prevAtMs = rawPrev ? rawPrev.at.getTime() : rawNext.at.getTime() - 8 * 3600 * 1000;
    const intervalMs = Math.max(1000, rawNext.at.getTime() - prevAtMs);
    const elapsedMs = Math.max(0, now.getTime() - prevAtMs);
    const progressPct = Math.min(100, Math.max(0, (elapsedMs / intervalMs) * 100));

    const next: NextPrayerData = {
      name: rawNext.name,
      time: formatPrayerTime(rawNext.at, place.tz, h12),
      at: rawNext.at,
      left: untilLabel(msLeft),
      countdown: {
        secondsLeft: totalSec,
        hours,
        minutes,
        seconds,
        formatted,
        arabic,
        progressPct,
      },
    };

    const prev: PrevPrayerData | null = rawPrev
      ? {
          name: rawPrev.name,
          time: formatPrayerTime(rawPrev.at, place.tz, h12),
          at: rawPrev.at,
        }
      : null;

    return { next, prev };
  }, [baseData, now]);

  return {
    now,
    loc,
    hijriToday,
    prayed,
    method: baseData?.method,
    tz: baseData?.tz,
    times: baseData?.times,
    next: countdownData?.next,
    prev: countdownData?.prev,
    hasLocation: !!loc,
  };
}
