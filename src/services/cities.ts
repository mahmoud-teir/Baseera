import { CITY_ROWS, COUNTRY_ROWS, TZS } from '@/data/world';

/**
 * Cities offered when the user chooses «يدوي» (manual) location instead of GPS.
 * Coordinates are city-centre approximations (±0.05°), adequate for prayer-time calculation.
 * `tz` is the city's IANA time zone (prayer times are calculated and shown in it, whatever the
 * phone's own zone is) and `cc` its ISO country code (for the automatic calculation method).
 */
export interface City {
  id: string;
  name: string;
  country: string;
  cc: string;
  tz: string;
  lat: number;
  lon: number;
  /** The country's capital (world data). */
  capital?: boolean;
}

export const CITIES: City[] = [
  { id: 'makkah', name: 'مكة المكرمة', country: 'السعودية', cc: 'SA', tz: 'Asia/Riyadh', lat: 21.4225, lon: 39.8262 },
  { id: 'madinah', name: 'المدينة المنورة', country: 'السعودية', cc: 'SA', tz: 'Asia/Riyadh', lat: 24.4672, lon: 39.6111 },
  { id: 'riyadh', name: 'الرياض', country: 'السعودية', cc: 'SA', tz: 'Asia/Riyadh', lat: 24.7136, lon: 46.6753 },
  { id: 'jeddah', name: 'جدة', country: 'السعودية', cc: 'SA', tz: 'Asia/Riyadh', lat: 21.4858, lon: 39.1925 },
  { id: 'dammam', name: 'الدمام', country: 'السعودية', cc: 'SA', tz: 'Asia/Riyadh', lat: 26.4207, lon: 50.0888 },
  { id: 'kuwait', name: 'الكويت', country: 'الكويت', cc: 'KW', tz: 'Asia/Kuwait', lat: 29.3759, lon: 47.9774 },
  { id: 'doha', name: 'الدوحة', country: 'قطر', cc: 'QA', tz: 'Asia/Qatar', lat: 25.2854, lon: 51.531 },
  { id: 'manama', name: 'المنامة', country: 'البحرين', cc: 'BH', tz: 'Asia/Bahrain', lat: 26.2285, lon: 50.586 },
  { id: 'abudhabi', name: 'أبوظبي', country: 'الإمارات', cc: 'AE', tz: 'Asia/Dubai', lat: 24.4539, lon: 54.3773 },
  { id: 'dubai', name: 'دبي', country: 'الإمارات', cc: 'AE', tz: 'Asia/Dubai', lat: 25.2048, lon: 55.2708 },
  { id: 'muscat', name: 'مسقط', country: 'عُمان', cc: 'OM', tz: 'Asia/Muscat', lat: 23.588, lon: 58.3829 },
  { id: 'sanaa', name: 'صنعاء', country: 'اليمن', cc: 'YE', tz: 'Asia/Aden', lat: 15.3694, lon: 44.191 },
  { id: 'amman', name: 'عمّان', country: 'الأردن', cc: 'JO', tz: 'Asia/Amman', lat: 31.9454, lon: 35.9284 },
  { id: 'jerusalem', name: 'القدس', country: 'فلسطين', cc: 'PS', tz: 'Asia/Hebron', lat: 31.7683, lon: 35.2137 },
  { id: 'gaza', name: 'غزة', country: 'فلسطين', cc: 'PS', tz: 'Asia/Gaza', lat: 31.5017, lon: 34.4668 },
  { id: 'ramallah', name: 'رام الله', country: 'فلسطين', cc: 'PS', tz: 'Asia/Hebron', lat: 31.9038, lon: 35.2034 },
  { id: 'hebron', name: 'الخليل', country: 'فلسطين', cc: 'PS', tz: 'Asia/Hebron', lat: 31.5326, lon: 35.0998 },
  { id: 'nablus', name: 'نابلس', country: 'فلسطين', cc: 'PS', tz: 'Asia/Hebron', lat: 32.2211, lon: 35.2544 },
  { id: 'damascus', name: 'دمشق', country: 'سوريا', cc: 'SY', tz: 'Asia/Damascus', lat: 33.5138, lon: 36.2765 },
  { id: 'beirut', name: 'بيروت', country: 'لبنان', cc: 'LB', tz: 'Asia/Beirut', lat: 33.8938, lon: 35.5018 },
  { id: 'baghdad', name: 'بغداد', country: 'العراق', cc: 'IQ', tz: 'Asia/Baghdad', lat: 33.3152, lon: 44.3661 },
  { id: 'cairo', name: 'القاهرة', country: 'مصر', cc: 'EG', tz: 'Africa/Cairo', lat: 30.0444, lon: 31.2357 },
  { id: 'alexandria', name: 'الإسكندرية', country: 'مصر', cc: 'EG', tz: 'Africa/Cairo', lat: 31.2001, lon: 29.9187 },
  { id: 'khartoum', name: 'الخرطوم', country: 'السودان', cc: 'SD', tz: 'Africa/Khartoum', lat: 15.5007, lon: 32.5599 },
  { id: 'tripoli', name: 'طرابلس', country: 'ليبيا', cc: 'LY', tz: 'Africa/Tripoli', lat: 32.8872, lon: 13.1913 },
  { id: 'tunis', name: 'تونس', country: 'تونس', cc: 'TN', tz: 'Africa/Tunis', lat: 36.8065, lon: 10.1815 },
  { id: 'algiers', name: 'الجزائر', country: 'الجزائر', cc: 'DZ', tz: 'Africa/Algiers', lat: 36.7538, lon: 3.0588 },
  { id: 'rabat', name: 'الرباط', country: 'المغرب', cc: 'MA', tz: 'Africa/Casablanca', lat: 34.0209, lon: -6.8416 },
  { id: 'casablanca', name: 'الدار البيضاء', country: 'المغرب', cc: 'MA', tz: 'Africa/Casablanca', lat: 33.5731, lon: -7.5898 },
  { id: 'nouakchott', name: 'نواكشوط', country: 'موريتانيا', cc: 'MR', tz: 'Africa/Nouakchott', lat: 18.0735, lon: -15.9582 },
  { id: 'istanbul', name: 'إسطنبول', country: 'تركيا', cc: 'TR', tz: 'Europe/Istanbul', lat: 41.0082, lon: 28.9784 },
  { id: 'tehran', name: 'طهران', country: 'إيران', cc: 'IR', tz: 'Asia/Tehran', lat: 35.6892, lon: 51.389 },
  { id: 'karachi', name: 'كراتشي', country: 'باكستان', cc: 'PK', tz: 'Asia/Karachi', lat: 24.8607, lon: 67.0011 },
  { id: 'islamabad', name: 'إسلام آباد', country: 'باكستان', cc: 'PK', tz: 'Asia/Karachi', lat: 33.6844, lon: 73.0479 },
  { id: 'dhaka', name: 'دكا', country: 'بنغلاديش', cc: 'BD', tz: 'Asia/Dhaka', lat: 23.8103, lon: 90.4125 },
  { id: 'kualalumpur', name: 'كوالالمبور', country: 'ماليزيا', cc: 'MY', tz: 'Asia/Kuala_Lumpur', lat: 3.139, lon: 101.6869 },
  { id: 'jakarta', name: 'جاكرتا', country: 'إندونيسيا', cc: 'ID', tz: 'Asia/Jakarta', lat: -6.2088, lon: 106.8456 },
  { id: 'london', name: 'لندن', country: 'المملكة المتحدة', cc: 'GB', tz: 'Europe/London', lat: 51.5072, lon: -0.1276 },
  { id: 'paris', name: 'باريس', country: 'فرنسا', cc: 'FR', tz: 'Europe/Paris', lat: 48.8566, lon: 2.3522 },
  { id: 'berlin', name: 'برلين', country: 'ألمانيا', cc: 'DE', tz: 'Europe/Berlin', lat: 52.52, lon: 13.405 },
  { id: 'newyork', name: 'نيويورك', country: 'الولايات المتحدة', cc: 'US', tz: 'America/New_York', lat: 40.7128, lon: -74.006 },
  { id: 'toronto', name: 'تورنتو', country: 'كندا', cc: 'CA', tz: 'America/Toronto', lat: 43.6532, lon: -79.3832 },
];

// ── Every country ───────────────────────────────────────────────────────────

export interface Country {
  cc: string;
  name: string;
  en: string;
}

/** All countries (Arabic names, sorted), from the generated world data. */
export const COUNTRIES: Country[] = COUNTRY_ROWS.map(([cc, name, en]) => ({ cc, name, en }));

const countryName = new Map(COUNTRIES.map((c) => [c.cc, c.name]));

/** Rough distance in km (enough to drop a GeoNames city that duplicates a listed one). */
function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const x = ((b.lon - a.lon) * Math.PI) / 180 * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  const y = ((b.lat - a.lat) * Math.PI) / 180;
  return Math.sqrt(x * x + y * y) * 6371;
}

/**
 * Cities to offer in a country: the hand-checked Arabic-named cities first, then the capital and
 * largest cities from GeoNames (Latin names), without near-duplicates.
 */
export function citiesIn(cc: string): City[] {
  const country = countryName.get(cc) ?? cc;
  const world = CITY_ROWS.filter((r) => r[0] === cc).map(([, name, lat, lon, tz, cap], i): City => ({ id: `w-${cc}-${i}`, name, country, cc, tz: TZS[tz], lat, lon, capital: cap === 1 }));
  // A listed city takes the capital mark of the GeoNames entry it replaces.
  const curated = CITIES.filter((c) => c.cc === cc).map((c) => (world.some((w) => w.capital && km(c, w) < 15) ? { ...c, capital: true } : c));
  return [...curated, ...world.filter((w) => !curated.some((c) => km(c, w) < 15))];
}

/** Arabic/Latin search normalisation: hamza forms, taa marbuta, alif maqsura, case, diacritics. */
export function normalizeSearch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    // Latin accents; Arabic harakat, hamza/madda marks split off by NFD, dagger alif, tatweel.
    .replace(/[\u0300-\u036f\u064B-\u0655\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}
