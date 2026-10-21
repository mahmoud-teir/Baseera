import { Platform } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { isRTL } from '@/theme/layout';

export interface IconProps {
  d: string;
  size?: number;
  color: string;
  sw?: number;
  /** Directional icons (back/forward chevrons) are drawn for RTL and mirrored if the layout is LTR. */
  directional?: boolean;
}

/** Decorative: hidden from screen readers (the parent control carries the label). */
const hidden = Platform.OS === 'web' ? { 'aria-hidden': true } : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

/** Stroke icon on a 24×24 viewBox with round caps/joins (readme: Iconography). */
export function Icon({ d, size = 24, color, sw = 2, directional }: IconProps) {
  const flip = directional && !isRTL();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={flip ? { transform: [{ scaleX: -1 }] } : undefined}
      {...hidden}>
      <Path d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** Lock glyph exactly as drawn in the prototype (rect x5 y11 14×10 rx2 + shackle). */
export function LockIcon({ size = 20, color, sw = 2 }: { size?: number; color: string; sw?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...hidden}>
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={color} strokeWidth={sw} fill="none" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
