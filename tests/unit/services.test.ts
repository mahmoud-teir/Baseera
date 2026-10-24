import { declinationFrom, estimateDeclination, magneticFromRotationAlpha, norm360, shortestDelta, smoothAngle, unwrap } from '@/features/qibla/headingMath';
import { distanceToKaaba, needleAngle, qiblaBearing } from '@/services/qibla';
import { AUTO_METHOD, dstMinutes, formatPrayerTime, isLtrTime, nextPrayer, paramsFor, parseAdjust, prayerTimesFor, resolveMethod } from '@/services/prayer';
import { hijriLabel, hijriMonth, shiftMonth, toHijri } from '@/services/hijri';
import { CITIES, citiesIn, COUNTRIES, normalizeSearch } from '@/services/cities';
import { TZS } from '@/data/world';
import { changePassword } from '@/services/auth';
import { getDeviceInfo } from '@/features/account/DevicesSheet';

describe('qibla', () => {
  // Reference bearings (great-circle, true north) widely published for these cities.
  it.each([
    ['Cairo', 30.0444, 31.2357, 136.1],
    ['London', 51.5072, -0.1276, 119.0],
    ['New York', 40.7128, -74.006, 58.5],
    ['Jakarta', -6.2088, 106.8456, 295.1],
    ['Istanbul', 41.0082, 28.9784, 151.6],
  ])('%s bearing ≈ %s°', (_n, lat, lon, expected) => {
    expect(qiblaBearing(lat, lon)).toBeCloseTo(expected, 0);
  });
  it('distance Cairo → Kaaba ≈ 1,290 km', () => {
    expect(distanceToKaaba(30.0444, 31.2357)).toBeGreaterThan(1270);
    expect(distanceToKaaba(30.0444, 31.2357)).toBeLessThan(1310);
  });
  // Independent check: bearing from 3D unit vectors (north/east tangent basis), not the atan2 formula.
  const vectorBearing = (lat: number, lon: number) => {
    const r = Math.PI / 180;
    const v = (la: number, lo: number) => [Math.cos(la * r) * Math.cos(lo * r), Math.cos(la * r) * Math.sin(lo * r), Math.sin(la * r)];
    const p = v(lat, lon);
    const k = v(21.4225, 39.8262);
    const east = [-Math.sin(lon * r), Math.cos(lon * r), 0];
    const north = [-Math.sin(lat * r) * Math.cos(lon * r), -Math.sin(lat * r) * Math.sin(lon * r), Math.cos(lat * r)];
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    return ((Math.atan2(dot(k, east), dot(k, north)) / r) + 360) % 360;
  };
  it.each([
    ['Gaza', 31.5017, 34.4668],
    ['Amman', 31.9454, 35.9239],
    ['Riyadh', 24.7136, 46.6753],
    ['Medina', 24.4672, 39.6111],
    ['Sydney', -33.8688, 151.2093],
    ['Los Angeles', 34.0522, -118.2437],
    ['Reykjavik', 64.1466, -21.9426],
  ])('%s: formula agrees with an independent vector method to 0.001°', (_n, lat, lon) => {
    expect(Math.abs(shortestDelta(vectorBearing(lat, lon), qiblaBearing(lat, lon)))).toBeLessThan(0.001);
  });
  it('distance is zero at the Kaaba', () => {
    expect(distanceToKaaba(21.4225, 39.8262)).toBeLessThan(0.001);
  });
  it('needle angle compensates the heading', () => {
    expect(needleAngle(136, 136)).toBe(0);
    expect(needleAngle(10, 350)).toBe(20);
  });
});

describe('prayer times', () => {
  const settings = { calc: 'أم القرى', asr: 'الجمهور', adj: '0' };
  const day = new Date(2026, 9, 20, 9, 0);
  it('are ordered and complete for Makkah', () => {
    const { times } = prayerTimesFor(21.4225, 39.8262, day, settings);
    expect(times.map((t) => t.name)).toEqual(['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء']);
    for (let i = 1; i < times.length; i++) expect(times[i].at.getTime()).toBeGreaterThan(times[i - 1].at.getTime());
  });
  it('Umm al-Qura sets Isha 90 minutes after Maghrib', () => {
    const { times } = prayerTimesFor(21.4225, 39.8262, day, settings);
    expect((times[5].at.getTime() - times[4].at.getTime()) / 60000).toBeCloseTo(90, 0);
  });
  it('Hanafi Asr is later than the majority Asr', () => {
    const a = prayerTimesFor(30.0444, 31.2357, day, { ...settings, calc: 'الهيئة المصرية' }).times[3].at.getTime();
    const h = prayerTimesFor(30.0444, 31.2357, day, { ...settings, calc: 'الهيئة المصرية', asr: 'الحنفي' }).times[3].at.getTime();
    expect(h).toBeGreaterThan(a + 20 * 60000);
  });
  it('applies the ±2 minute adjustment', () => {
    expect(parseAdjust('−2')).toBe(-2);
    expect(parseAdjust('+1')).toBe(1);
    const base = prayerTimesFor(21.4225, 39.8262, day, settings).times[2].at.getTime();
    const plus = prayerTimesFor(21.4225, 39.8262, day, { ...settings, adj: '+2' }).times[2].at.getTime();
    expect((plus - base) / 60000).toBeCloseTo(2, 0);
    expect(paramsFor({ ...settings, adj: '0' }).adjustments.dhuhr).toBe(0);
  });
  it('next prayer is never sunrise and rolls over to tomorrow’s Fajr', () => {
    const late = new Date(2026, 9, 20, 23, 50);
    const n = nextPrayer(21.4225, 39.8262, late, settings);
    expect(n.name).toBe('الفجر');
    expect(n.at.getTime()).toBeGreaterThan(late.getTime());
  });
});

describe('hijri (Umm al-Qura)', () => {
  it('converts 20 Oct 2026 to 9 Jumada al-Ula 1448', () => {
    expect(toHijri(new Date(2026, 9, 20))).toEqual({ hy: 1448, hm: 5, hd: 9 });
    expect(hijriLabel({ hy: 1448, hm: 5, hd: 9 })).toBe('9 جمادى الأولى 1448 هـ');
  });
  it('builds a month grid starting on day 1 with 29 or 30 days', () => {
    const m = hijriMonth(1448, 9, new Date(2026, 9, 20));
    expect([29, 30]).toContain(m.days);
    expect(toHijri(m.start)).toEqual({ hy: 1448, hm: 9, hd: 1 });
    expect(m.offset).toBeGreaterThanOrEqual(0);
    expect(m.offset).toBeLessThan(7);
  });
  it('wraps month navigation across years', () => {
    expect(shiftMonth(1448, 12, 1)).toEqual({ hy: 1449, hm: 1 });
    expect(shiftMonth(1448, 1, -1)).toEqual({ hy: 1447, hm: 12 });
  });
});

describe('compass heading math', () => {
  it('normalises and finds the shortest turn across north', () => {
    expect(norm360(-10)).toBe(350);
    expect(shortestDelta(350, 10)).toBe(20);
    expect(shortestDelta(10, 350)).toBe(-20);
    expect(shortestDelta(0, 180)).toBe(180);
  });
  it('unwraps so the needle never spins the long way round', () => {
    let a = unwrap(null, 355);
    a = unwrap(a, 3);
    expect(a).toBe(363);
    a = unwrap(a, 350);
    expect(a).toBe(350);
  });
  it('smooths on the circle (359° and 1° average to 0°, not 180°)', () => {
    const m = smoothAngle(359, 1, 0.5);
    expect(Math.min(m, 360 - m)).toBeLessThan(1e-9);
    expect(smoothAngle(null, 370, 0.25)).toBe(10);
  });
  it('derives declination only when a true heading exists', () => {
    expect(declinationFrom(-1, 120)).toBeNull();
    expect(declinationFrom(125, 120)).toBe(5); // 5° east
    expect(declinationFrom(2, 358)).toBe(4); // across north
    expect(declinationFrom(355, 2)).toBe(-7); // west
  });
  it('converts the fused-sensor rotation alpha to a magnetic heading', () => {
    expect(magneticFromRotationAlpha(0)).toBe(0);
    expect(magneticFromRotationAlpha(-Math.PI / 2)).toBeCloseTo(90, 9); // alpha = −azimuth
    expect(magneticFromRotationAlpha(Math.PI / 2)).toBeCloseTo(270, 9);
  });
  it('estimates geomagnetic declination reasonably (positive in Middle East)', () => {
    const cairo = estimateDeclination(30.0444, 31.2357);
    const makkah = estimateDeclination(21.4225, 39.8262);
    expect(cairo).toBeGreaterThan(1);
    expect(cairo).toBeLessThan(8);
    expect(makkah).toBeGreaterThan(1);
    expect(makkah).toBeLessThan(7);
  });
});

describe('prayer time accuracy rules', () => {
  const S = { calc: 'تلقائي حسب البلد', asr: 'الجمهور', adj: '0' };
  const cfg = { highLatitude: false, dst: true };

  it('automatic method follows the location country; an explicit choice wins', () => {
    expect(resolveMethod(AUTO_METHOD, 'SA')).toBe('أم القرى');
    expect(resolveMethod(AUTO_METHOD, 'eg')).toBe('الهيئة المصرية');
    expect(resolveMethod(AUTO_METHOD, 'PK')).toBe('كراتشي');
    expect(resolveMethod(AUTO_METHOD, 'AE')).toBe('دبي');
    expect(resolveMethod(AUTO_METHOD, 'FR')).toBe('رابطة العالم الإسلامي');
    expect(resolveMethod(AUTO_METHOD, undefined)).toBe('رابطة العالم الإسلامي');
    expect(resolveMethod('كراتشي', 'SA')).toBe('كراتشي');
  });

  // Independent astronomy check: solar noon from the equation of time (NOAA approximation),
  // without the adhan library. Dhuhr must sit just after it (adhan adds no extra minutes here).
  const solarNoonUtcMin = (date: Date, lon: number) => {
    const n = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getUTCFullYear(), 0, 0)) / 864e5);
    const g = ((2 * Math.PI) / 365) * (n - 1);
    const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    return 720 - 4 * lon - eot;
  };
  it.each([
    ['Makkah', 21.4225, 39.8262, 'Asia/Riyadh', 'SA'],
    ['Gaza', 31.5017, 34.4668, 'Asia/Gaza', 'PS'],
    ['Rabat', 34.0209, -6.8416, 'Africa/Casablanca', 'MA'],
    ['Jakarta', -6.2088, 106.8456, 'Asia/Jakarta', 'ID'],
    ['New York', 40.7128, -74.006, 'America/New_York', 'US'],
  ])('%s: Dhuhr is within 3 minutes of independently computed solar noon', (_n, lat, lon, tz, country) => {
    const day = new Date(Date.UTC(2026, 9, 21, 12));
    const dhuhr = prayerTimesFor(lat, lon, day, S, cfg, { tz, country }).times[2].at;
    const dhuhrUtcMin = dhuhr.getUTCHours() * 60 + dhuhr.getUTCMinutes();
    const diff = dhuhrUtcMin - solarNoonUtcMin(day, lon);
    expect(diff).toBeGreaterThanOrEqual(-1);
    expect(diff).toBeLessThanOrEqual(3);
  });

  it('shows times in the location time zone, not the phone time zone', () => {
    const day = new Date(Date.UTC(2026, 9, 21, 12));
    const dhuhr = prayerTimesFor(21.4225, 39.8262, day, S, cfg, { tz: 'Asia/Riyadh', country: 'SA' }).times[2].at;
    // Makkah solar noon on 21 Oct ≈ 09:05 UTC (equation of time ≈ +15 min) → 12:0x in Riyadh time
    // (UTC+3) and 18:0x in Tokyo (UTC+9), whatever zone runs this test.
    expect(formatPrayerTime(dhuhr, 'Asia/Riyadh', false)).toMatch(/^12:0\d$/);
    expect(formatPrayerTime(dhuhr, 'Asia/Tokyo', false)).toMatch(/^18:0\d$/);
  });

  it('formats 24-hour and 12-hour (ص / م) times', () => {
    const t = new Date(Date.UTC(2026, 9, 21, 2, 5)); // 05:05 in Riyadh
    expect(formatPrayerTime(t, 'Asia/Riyadh', false)).toBe('05:05');
    expect(formatPrayerTime(t, 'Asia/Riyadh', true)).toBe('5:05 ص');
    const pm = new Date(Date.UTC(2026, 9, 21, 15, 40)); // 18:40 in Riyadh
    expect(formatPrayerTime(pm, 'Asia/Riyadh', true)).toBe('6:40 م');
    const noon = new Date(Date.UTC(2026, 9, 21, 9, 0)); // 12:00 in Riyadh
    expect(formatPrayerTime(noon, 'Asia/Riyadh', true)).toBe('12:00 م');
    expect(isLtrTime('05:05')).toBe(true);
    expect(isLtrTime('5:05 ص')).toBe(false);
  });

  it('Umm al-Qura: Isha is 120 minutes after Maghrib in Ramadan, 90 otherwise', () => {
    const gap = (d: Date) => {
      const ts = prayerTimesFor(21.4225, 39.8262, d, S, cfg, { tz: 'Asia/Riyadh', country: 'SA' }).times;
      return Math.round((ts[5].at.getTime() - ts[4].at.getTime()) / 60000);
    };
    expect(gap(new Date(Date.UTC(2026, 2, 1, 12)))).toBe(120); // 12 Ramadan 1447
    expect(gap(new Date(Date.UTC(2026, 9, 21, 12)))).toBe(90);
  });

  it('daylight saving is measured in the location zone', () => {
    expect(dstMinutes(new Date(Date.UTC(2026, 6, 1, 12)), 'America/New_York')).toBe(60);
    expect(dstMinutes(new Date(Date.UTC(2026, 0, 15, 12)), 'America/New_York')).toBe(0);
    expect(dstMinutes(new Date(Date.UTC(2026, 6, 1, 12)), 'Asia/Riyadh')).toBe(0);
  });
});

describe('world countries and cities (location picker)', () => {
  it('lists every country with at least one city, valid coordinates and a real time zone', () => {
    expect(COUNTRIES.length).toBeGreaterThan(240);
    for (const z of TZS) expect(() => new Intl.DateTimeFormat('en-US', { timeZone: z })).not.toThrow();
    for (const c of COUNTRIES) {
      const list = citiesIn(c.cc);
      expect(list.length).toBeGreaterThan(0);
      for (const x of list) {
        expect(Math.abs(x.lat)).toBeLessThanOrEqual(90);
        expect(Math.abs(x.lon)).toBeLessThanOrEqual(180);
      }
    }
  });
  it('puts the Arabic-named cities first and drops their GeoNames duplicates', () => {
    const sa = citiesIn('SA');
    expect(sa.slice(0, 5).map((c) => c.id)).toEqual(['makkah', 'madinah', 'riyadh', 'jeddah', 'dammam']);
    expect(sa.filter((c) => c.name === 'Riyadh')).toHaveLength(0);
    expect(citiesIn('DE').filter((c) => c.capital).map((c) => c.name)).toEqual(['برلين']);
    expect(citiesIn('SA').filter((c) => c.capital).map((c) => c.name)).toEqual(['الرياض']);
    expect(citiesIn('DE').every((c) => c.tz === 'Europe/Berlin' && c.country === 'ألمانيا')).toBe(true);
  });
  it('every hand-listed city belongs to a listed country', () => {
    for (const c of CITIES) expect(COUNTRIES.some((k) => k.cc === c.cc)).toBe(true);
  });
  it('search ignores hamza forms, taa marbuta and case', () => {
    expect(normalizeSearch('السعوديه')).toBe(normalizeSearch('السعودية'));
    expect(normalizeSearch('اندونيسيا')).toBe(normalizeSearch('إندونيسيا'));
    expect(normalizeSearch('GERMANY')).toBe('germany');
  });
});

describe('auth & device info', () => {
  it('changePassword returns unavailable when backend is not connected', async () => {
    const res = await changePassword('oldPass123', 'newPass123');
    expect(res.ok).toBe(false);
  });

  it('getDeviceInfo returns current device info', () => {
    const info = getDeviceInfo();
    expect(info.title).toBeTruthy();
    expect(info.os).toBeTruthy();
    expect(info.type).toBeTruthy();
  });
});
