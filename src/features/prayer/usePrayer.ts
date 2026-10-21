import { useEffect, useMemo, useState } from 'react';

import { useMounted } from '@/utils/useMounted';

import { hijriLabel, toHijri } from '@/services/hijri';
import { nextPrayer, prayerTimesFor } from '@/services/prayer';
import { useApp } from '@/state/app-store';
import { useConfig } from '@/state/config-store';
import { dayKey, hhmm, untilLabel } from '@/utils/date';

/** Ticks every 30s so countdowns stay fresh. `null` until mounted (time is client-only). */
export function useMinuteClock(): Date | null {
  const mounted = useMounted();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return mounted ? now : null;
}

export function useHijriToday(now: Date | null) {
  const adj = useConfig((s) => s.prayer.hijriAdj);
  return useMemo(() => (now ? hijriLabel(toHijri(now, adj)) : ''), [now, adj]);
}

export function usePrayer() {
  const now = useMinuteClock();
  const loc = useApp((s) => s.location);
  const sv = useApp((s) => s.sv);
  const cfg = useConfig((s) => s.prayer);
  const setting = useApp((s) => s.setting);
  const prayedAll = useApp((s) => s.prayed);
  const prayed = now ? (prayedAll[dayKey(now)] ?? {}) : {};
  const hijriToday = useHijriToday(now);
  const data = useMemo(() => {
    if (!loc || !now) return null;
    const settings = { calc: setting('calc'), asr: setting('asr'), adj: setting('adj') };
    const { times } = prayerTimesFor(loc.lat, loc.lon, now, settings);
    const nx = nextPrayer(loc.lat, loc.lon, now, settings);
    return {
      times: times.map((x) => ({ name: x.name, time: hhmm(x.at), at: x.at })),
      next: { name: nx.name, time: hhmm(nx.at), left: untilLabel(nx.at.getTime() - now.getTime()) },
    };
    // sv and the console defaults (cfg) drive `setting` and prayerTimesFor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc, now, sv, cfg]);
  return { now, loc, hijriToday, prayed, ...data, hasLocation: !!loc };
}
