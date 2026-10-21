import { distanceToKaaba, needleAngle, qiblaBearing } from '@/services/qibla';
import { nextPrayer, paramsFor, parseAdjust, prayerTimesFor } from '@/services/prayer';
import { hijriLabel, hijriMonth, shiftMonth, toHijri } from '@/services/hijri';

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
