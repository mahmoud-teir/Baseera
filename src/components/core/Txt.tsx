import { Platform, Text, type TextProps, type TextStyle } from 'react-native';

import type { FontRole, Weight } from '@/theme/fonts';
import { useTheme } from '@/theme/theme';
import type { Mutable } from '@/utils/types';

export interface TxtProps extends TextProps {
  /** Font role — ui = IBM Plex Sans Arabic · display = mood heading font (Amiri) · calligraphy = Aref Ruqaa · quran = Amiri Quran */
  font?: FontRole;
  size?: number;
  weight?: Weight;
  color?: string;
  /** Line height as a ratio of the font size (CSS unitless line-height). */
  lh?: number;
  align?: TextStyle['textAlign'];
  /** Render as an LTR island (codes like AQ-01, times, «BASEERAH»). */
  ltr?: boolean;
  /** Skip the user's font-size scale (fixed artwork such as the logo). */
  fixed?: boolean;
}

/**
 * Text primitive. Resolves the custom font family per weight (Android cannot synthesise weights),
 * applies the «حجم الخط» scale and converts unitless line-heights to points.
 */
export function Txt({ font: role = 'ui', size = 17, weight = 400, color, lh, align, ltr, fixed, style, ...rest }: TxtProps) {
  const th = useTheme();
  const fontSize = fixed ? size : Math.round(size * th.scale * 10) / 10;
  const s: Mutable<TextStyle> = {
    fontFamily: th.font(role, weight),
    fontSize,
    color: color ?? th.t.ink,
  };
  if (lh) s.lineHeight = Math.round(fontSize * lh);
  if (align) s.textAlign = align;
  if (ltr) {
    s.writingDirection = 'ltr';
  }
  if (Platform.OS === 'web' && ltr) {
    (s as Record<string, unknown>).direction = 'ltr';
    (s as Record<string, unknown>).unicodeBidi = 'isolate';
  }
  // react-native-web renders text with dir="auto", which flips Arabic lines that start with a
  // Latin code (e.g. «AQ-01 · العقيدة») to LTR order. Paragraphs are RTL; LTR islands opt in.
  const webDir = Platform.OS === 'web' ? ({ dir: ltr ? 'ltr' : 'rtl' } as object) : null;
  return <Text {...webDir} {...rest} style={[s, style]} />;
}
