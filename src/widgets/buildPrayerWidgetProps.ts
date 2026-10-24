import AsyncStorage from '@react-native-async-storage/async-storage';

import { toArabicDigits } from '@/data/quran';
import { toHijri, hijriLabel } from '@/services/hijri';
import { formatPrayerTime, nextPrayer, prayerTimesFor } from '@/services/prayer';
import type { PrayerItem, PrayerWidgetProps } from './PrayerWidget';

export async function buildPrayerWidgetProps(width: number, height: number): Promise<PrayerWidgetProps> {
  let lat = 21.4225;
  let lon = 39.8262;
  let locationLabel = 'مكة المكرمة';
  let tz: string | undefined = undefined;
  let country: string | undefined = 'SA';
  let calc = 'تلقائي حسب البلد';
  let asr: 'الجمهور' | 'الحنفي' = 'الجمهور';
  let adj = '0';
  let h12 = true;

  try {
    const raw = await AsyncStorage.getItem('baseerah.app.v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed?.state;
      if (state?.location) {
        lat = state.location.lat;
        lon = state.location.lon;
        locationLabel = state.location.label || state.location.city || 'موقعي';
        tz = state.location.tz;
        country = state.location.country;
      }
      if (state?.sv) {
        calc = state.sv.calc ?? calc;
        asr = state.sv.asr ?? asr;
        adj = state.sv.adj ?? adj;
        if (state.sv.clock) {
          h12 = state.sv.clock === '12 ساعة';
        }
      }
    }
  } catch {
    // fallback to defaults on error
  }

  const now = new Date();
  const settings = { calc, asr, adj };
  const place = { tz, country };

  const dayTimes = prayerTimesFor(lat, lon, now, settings, undefined, place);
  const next = nextPrayer(lat, lon, now, settings, place);

  const diffMs = next.at.getTime() - now.getTime();
  const diffMins = Math.max(1, Math.round(diffMs / 60000));
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  let timeRemaining = '';
  if (hours > 0) {
    timeRemaining = `بعد ${toArabicDigits(hours)} س و ${toArabicDigits(mins)} د`;
  } else {
    timeRemaining = `بعد ${toArabicDigits(mins)} دقيقة`;
  }

  const hDate = toHijri(now);
  const hijriDate = toArabicDigits(hijriLabel(hDate));

  // Determine current active prayer (the last one whose time has passed today)
  const passedToday = dayTimes.times.filter((t) => t.name !== 'الشروق' && t.at.getTime() <= now.getTime());
  const currentActiveName = passedToday.length > 0 ? passedToday[passedToday.length - 1].name : 'العشاء';

  const times: PrayerItem[] = dayTimes.times
    .filter((t) => t.name !== 'الشروق')
    .map((t) => ({
      name: t.name,
      time: toArabicDigits(formatPrayerTime(t.at, tz, h12)),
      isNext: t.name === next.name,
      isCurrent: t.name === currentActiveName,
    }));

  return {
    hijriDate,
    locationLabel,
    nextPrayerName: next.name,
    nextPrayerTime: toArabicDigits(formatPrayerTime(next.at, tz, h12)),
    timeRemaining,
    isCompact: height < 140,
    times,
  };
}
