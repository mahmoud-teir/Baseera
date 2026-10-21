/**
 * Cities offered when the user chooses «يدوي» (manual) location instead of GPS.
 * Coordinates are city-centre approximations (±0.05°), adequate for prayer-time calculation.
 */
export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export const CITIES: City[] = [
  { id: 'makkah', name: 'مكة المكرمة', country: 'السعودية', lat: 21.4225, lon: 39.8262 },
  { id: 'madinah', name: 'المدينة المنورة', country: 'السعودية', lat: 24.4672, lon: 39.6111 },
  { id: 'riyadh', name: 'الرياض', country: 'السعودية', lat: 24.7136, lon: 46.6753 },
  { id: 'jeddah', name: 'جدة', country: 'السعودية', lat: 21.4858, lon: 39.1925 },
  { id: 'dammam', name: 'الدمام', country: 'السعودية', lat: 26.4207, lon: 50.0888 },
  { id: 'kuwait', name: 'الكويت', country: 'الكويت', lat: 29.3759, lon: 47.9774 },
  { id: 'doha', name: 'الدوحة', country: 'قطر', lat: 25.2854, lon: 51.531 },
  { id: 'manama', name: 'المنامة', country: 'البحرين', lat: 26.2285, lon: 50.586 },
  { id: 'abudhabi', name: 'أبوظبي', country: 'الإمارات', lat: 24.4539, lon: 54.3773 },
  { id: 'dubai', name: 'دبي', country: 'الإمارات', lat: 25.2048, lon: 55.2708 },
  { id: 'muscat', name: 'مسقط', country: 'عُمان', lat: 23.588, lon: 58.3829 },
  { id: 'sanaa', name: 'صنعاء', country: 'اليمن', lat: 15.3694, lon: 44.191 },
  { id: 'amman', name: 'عمّان', country: 'الأردن', lat: 31.9454, lon: 35.9284 },
  { id: 'jerusalem', name: 'القدس', country: 'فلسطين', lat: 31.7683, lon: 35.2137 },
  { id: 'damascus', name: 'دمشق', country: 'سوريا', lat: 33.5138, lon: 36.2765 },
  { id: 'beirut', name: 'بيروت', country: 'لبنان', lat: 33.8938, lon: 35.5018 },
  { id: 'baghdad', name: 'بغداد', country: 'العراق', lat: 33.3152, lon: 44.3661 },
  { id: 'cairo', name: 'القاهرة', country: 'مصر', lat: 30.0444, lon: 31.2357 },
  { id: 'alexandria', name: 'الإسكندرية', country: 'مصر', lat: 31.2001, lon: 29.9187 },
  { id: 'khartoum', name: 'الخرطوم', country: 'السودان', lat: 15.5007, lon: 32.5599 },
  { id: 'tripoli', name: 'طرابلس', country: 'ليبيا', lat: 32.8872, lon: 13.1913 },
  { id: 'tunis', name: 'تونس', country: 'تونس', lat: 36.8065, lon: 10.1815 },
  { id: 'algiers', name: 'الجزائر', country: 'الجزائر', lat: 36.7538, lon: 3.0588 },
  { id: 'rabat', name: 'الرباط', country: 'المغرب', lat: 34.0209, lon: -6.8416 },
  { id: 'casablanca', name: 'الدار البيضاء', country: 'المغرب', lat: 33.5731, lon: -7.5898 },
  { id: 'nouakchott', name: 'نواكشوط', country: 'موريتانيا', lat: 18.0735, lon: -15.9582 },
  { id: 'istanbul', name: 'إسطنبول', country: 'تركيا', lat: 41.0082, lon: 28.9784 },
  { id: 'tehran', name: 'طهران', country: 'إيران', lat: 35.6892, lon: 51.389 },
  { id: 'karachi', name: 'كراتشي', country: 'باكستان', lat: 24.8607, lon: 67.0011 },
  { id: 'islamabad', name: 'إسلام آباد', country: 'باكستان', lat: 33.6844, lon: 73.0479 },
  { id: 'dhaka', name: 'دكا', country: 'بنغلاديش', lat: 23.8103, lon: 90.4125 },
  { id: 'kualalumpur', name: 'كوالالمبور', country: 'ماليزيا', lat: 3.139, lon: 101.6869 },
  { id: 'jakarta', name: 'جاكرتا', country: 'إندونيسيا', lat: -6.2088, lon: 106.8456 },
  { id: 'london', name: 'لندن', country: 'المملكة المتحدة', lat: 51.5072, lon: -0.1276 },
  { id: 'paris', name: 'باريس', country: 'فرنسا', lat: 48.8566, lon: 2.3522 },
  { id: 'berlin', name: 'برلين', country: 'ألمانيا', lat: 52.52, lon: 13.405 },
  { id: 'newyork', name: 'نيويورك', country: 'الولايات المتحدة', lat: 40.7128, lon: -74.006 },
  { id: 'toronto', name: 'تورنتو', country: 'كندا', lat: 43.6532, lon: -79.3832 },
];
