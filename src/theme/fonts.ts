/**
 * Font registry. Only the weights the design uses are bundled (HANDOFF §3: IBM Plex Sans Arabic
 * 400–700 for UI; Amiri for headings; Aref Ruqaa for name medallions; Noto Naskh / Tajawal for
 * the alternate moods; Amiri Quran for the mushaf text).
 *
 * Android cannot synthesise weights for custom fonts, so every weight is its own family name and
 * `fontFamilyFor()` resolves (role, weight) → family.
 */
import { IBMPlexSansArabic_400Regular } from '@expo-google-fonts/ibm-plex-sans-arabic/400Regular';
import { IBMPlexSansArabic_500Medium } from '@expo-google-fonts/ibm-plex-sans-arabic/500Medium';
import { IBMPlexSansArabic_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-arabic/600SemiBold';
import { IBMPlexSansArabic_700Bold } from '@expo-google-fonts/ibm-plex-sans-arabic/700Bold';
import { Amiri_400Regular } from '@expo-google-fonts/amiri/400Regular';
import { Amiri_700Bold } from '@expo-google-fonts/amiri/700Bold';
import { ArefRuqaa_400Regular } from '@expo-google-fonts/aref-ruqaa/400Regular';
import { ArefRuqaa_700Bold } from '@expo-google-fonts/aref-ruqaa/700Bold';
import { NotoNaskhArabic_500Medium } from '@expo-google-fonts/noto-naskh-arabic/500Medium';
import { NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic/700Bold';
import { Tajawal_500Medium } from '@expo-google-fonts/tajawal/500Medium';
import { Tajawal_700Bold } from '@expo-google-fonts/tajawal/700Bold';
import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran/400Regular';

import type { DisplayFont } from './tokens';

export const FONT_ASSETS = {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  Amiri_400Regular,
  Amiri_700Bold,
  ArefRuqaa_400Regular,
  ArefRuqaa_700Bold,
  NotoNaskhArabic_500Medium,
  NotoNaskhArabic_700Bold,
  Tajawal_500Medium,
  Tajawal_700Bold,
  AmiriQuran_400Regular,
};

export type FontRole = 'ui' | 'display' | 'calligraphy' | 'quran';
export type Weight = 400 | 500 | 600 | 700;

const UI: Record<Weight, string> = {
  400: 'IBMPlexSansArabic_400Regular',
  500: 'IBMPlexSansArabic_500Medium',
  600: 'IBMPlexSansArabic_600SemiBold',
  700: 'IBMPlexSansArabic_700Bold',
};

const DISPLAY: Record<DisplayFont, (w: Weight) => string> = {
  amiri: (w) => (w >= 600 ? 'Amiri_700Bold' : 'Amiri_400Regular'),
  plex: (w) => UI[w],
  naskh: (w) => (w >= 600 ? 'NotoNaskhArabic_700Bold' : 'NotoNaskhArabic_500Medium'),
  tajawal: (w) => (w >= 600 ? 'Tajawal_700Bold' : 'Tajawal_500Medium'),
};

export function fontFamilyFor(role: FontRole, weight: Weight, display: DisplayFont): string {
  switch (role) {
    case 'display':
      return DISPLAY[display](weight);
    case 'calligraphy':
      return weight >= 600 ? 'ArefRuqaa_700Bold' : 'ArefRuqaa_400Regular';
    case 'quran':
      return 'AmiriQuran_400Regular';
    default:
      return UI[weight];
  }
}
