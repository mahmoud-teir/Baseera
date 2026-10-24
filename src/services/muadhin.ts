/**
 * خدمة المؤذنين وصوت الأذان لمواقيت الصلاة — تطبيق بصيرة.
 * تدعم أشهر المؤذنين مع الاستماع المسبق وخاصية الصدوح حتى في الوضع الصامت.
 */
export interface MuadhinInfo {
  id: string;
  name: string;
  place: string;
  audioUrl: string;
  soundName: string;
  isFajrOnly?: boolean;
}

export const MUADHINS: MuadhinInfo[] = [
  {
    id: 'makkah',
    name: 'الشيخ علي أحمد ملا',
    place: 'المسجد الحرام بمكة المكرمة (شيخ مؤذني الحرم)',
    audioUrl: 'https://raw.githubusercontent.com/abodehq/Athan-MP3/master/Sounds/Athan%20Makkah.mp3',
    soundName: 'adhan_makkah',
  },
  {
    id: 'abdulbasit',
    name: 'الشيخ عبد الباسط عبد الصمد رحمه الله',
    place: 'الأذان المصري الخاشع',
    audioUrl: 'https://raw.githubusercontent.com/abodehq/Athan-MP3/master/Sounds/Athan%20Abed%20Albase6.mp3',
    soundName: 'adhan_makkah',
  },
  {
    id: 'alafasy',
    name: 'الشيخ مشاري راشد العفاسي',
    place: 'أذان الكويت',
    audioUrl: 'https://raw.githubusercontent.com/abodehq/Athan-MP3/master/Sounds/Athan%20Mishary%20Alafasi.mp3',
    soundName: 'adhan_makkah',
  },
  {
    id: 'qatami',
    name: 'الشيخ ناصر القطامي',
    place: 'أذان الرياض',
    audioUrl: 'https://raw.githubusercontent.com/abodehq/Athan-MP3/master/Sounds/Athan%20Nasser%20Alqatami.mp3',
    soundName: 'adhan_makkah',
  },
  {
    id: 'fajr',
    name: 'أذان الفجر (الصلاة خير من النوم)',
    place: 'الأذان الندي مع عبارة التثويب',
    audioUrl: 'https://raw.githubusercontent.com/abodehq/Athan-MP3/master/Sounds/Athan%20Al-fajer%20-%20Malek%20chebae.mp3',
    soundName: 'adhan_makkah',
    isFajrOnly: true,
  },
  {
    id: 'zahrani',
    name: 'الشيخ منصور الزهراني',
    place: 'الأذان المكي والنجدي',
    audioUrl: 'https://raw.githubusercontent.com/abodehq/Athan-MP3/master/Sounds/Athan%20Mansoor%20Az-Zahrani.mp3',
    soundName: 'adhan_makkah',
  },
];

export const DEFAULT_MUADHIN = MUADHINS[0];

export function getMuadhinInfo(idOrName?: string | null): MuadhinInfo {
  if (!idOrName) return DEFAULT_MUADHIN;
  const q = idOrName.trim().toLowerCase();
  return (
    MUADHINS.find(
      (m) =>
        m.id.toLowerCase() === q ||
        m.name.toLowerCase() === q ||
        m.name.includes(idOrName) ||
        idOrName.includes(m.name)
    ) ?? DEFAULT_MUADHIN
  );
}
