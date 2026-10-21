/**
 * Ornament — «مربعان متداخلان (نجمة ثمانية) + شبكة معيّنات 45° بخط 1px كل 22–26px» (HANDOFF §3).
 * Opacity follows the app's ornament level (بلا / هادئة / غنية).
 */
import { View, type ViewStyle } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { useId } from 'react';

import { edge } from '@/theme/layout';
import { useTheme } from '@/theme/theme';
import type { Mutable } from '@/utils/types';

/** Rotated square outline used in hero card corners. Positions are physical (LTR) like the CSS. */
export function CornerDiamond({
  size,
  left,
  top,
  right,
  bottom,
  color = 'rgba(196,166,106,0.45)',
  opacity,
}: {
  size: number;
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  color?: string;
  opacity?: number;
}) {
  const { dOp } = useTheme();
  const s: Mutable<ViewStyle> = {
    position: 'absolute',
    width: size,
    height: size,
    borderWidth: 1.5,
    borderColor: color,
    transform: [{ rotate: '45deg' }],
    opacity: opacity ?? dOp,
  };
  // The prototype is RTL with physical left/right; RN swaps left/right in RTL, so map to logical end/start.
  if (left !== undefined) Object.assign(s, edge.end(left));
  if (right !== undefined) Object.assign(s, edge.start(right));
  if (top !== undefined) s.top = top;
  if (bottom !== undefined) s.bottom = bottom;
  return <View pointerEvents="none" style={s} />;
}

/** 45° / −45° lattice of 1px lines (repeating-linear-gradient in the prototype). */
export function Lattice({ opacity, spacing = 26, color, strokeWidth = 1 }: { opacity?: number; spacing?: number; color?: string; strokeWidth?: number }) {
  const { patOp, gc } = useTheme();
  const id = useId().replace(/[:]/g, '');
  const op = opacity ?? patOp;
  if (!op) return null;
  const s = spacing * Math.SQRT2;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: op, overflow: 'hidden' }}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={`lat${id}`} patternUnits="userSpaceOnUse" width={s} height={s}>
            <Line x1={0} y1={0} x2={s} y2={s} stroke={color ?? gc} strokeWidth={strokeWidth} />
            <Line x1={s} y1={0} x2={0} y2={s} stroke={color ?? gc} strokeWidth={strokeWidth} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#lat${id})`} />
      </Svg>
    </View>
  );
}

/**
 * Logo — eight-point star (two squares) with crescent, built from the welcome-screen geometry
 * (132px box). `size` scales it uniformly. Drawn LTR so the crescent faces the same way as the design.
 */
export function Logo({ size = 132, pc, gc, ivory = '#FAF8F2' }: { size?: number; pc: string; gc: string; ivory?: string }) {
  const k = size / 132;
  const sq = (x: number, s: number, bg: string, rot: boolean, key: string) => (
    <View
      key={key}
      style={{
        position: 'absolute',
        left: x * k,
        top: x * k,
        width: s * k,
        height: s * k,
        backgroundColor: bg,
        transform: rot ? [{ rotate: '45deg' }] : undefined,
      }}
    />
  );
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="شعار بصيرة"
      style={{ width: size, height: size, direction: 'ltr' }}>
      {sq(18, 96, gc, false, 'a')}
      {sq(18, 96, gc, true, 'b')}
      {sq(26, 80, pc, false, 'c')}
      {sq(26, 80, pc, true, 'd')}
      {sq(35, 62, gc, false, 'e')}
      {sq(35, 62, gc, true, 'f')}
      {sq(39, 54, pc, false, 'g')}
      {sq(39, 54, pc, true, 'h')}
      <View style={{ position: 'absolute', left: 46 * k, top: 46 * k, width: 40 * k, height: 40 * k, borderRadius: 20 * k, backgroundColor: ivory }} />
      <View style={{ position: 'absolute', left: 55 * k, top: 42 * k, width: 36 * k, height: 36 * k, borderRadius: 18 * k, backgroundColor: pc }} />
      <View style={{ position: 'absolute', left: 78 * k, top: 52 * k, width: 10 * k, height: 10 * k, backgroundColor: gc, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

/** Large welcome ornament: two squares + two circles in gold at low opacity. */
export function WelcomeOrnament({ opacity, gc }: { opacity: number; gc: string }) {
  if (!opacity) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: -120, left: -120, width: 640, height: 640, opacity, direction: 'ltr' }}>
      <View style={{ position: 'absolute', top: 140, left: 140, right: 140, bottom: 140, borderWidth: 1.5, borderColor: gc }} />
      <View style={{ position: 'absolute', top: 140, left: 140, right: 140, bottom: 140, borderWidth: 1.5, borderColor: gc, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', top: 80, left: 80, right: 80, bottom: 80, borderWidth: 1, borderColor: gc, borderRadius: 240 }} />
      <View style={{ position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, borderWidth: 1, borderColor: gc, borderRadius: 300 }} />
    </View>
  );
}
