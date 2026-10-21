import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Press } from '@/components/core/Press';
import { useTheme } from '@/theme/theme';

import { CornerDiamond, Lattice } from './Ornament';

/** Green hero card (continue card, profile card, prayer hero…) with corner diamond + lattice. */
export function Hero({
  children,
  radius = 24,
  pad = 18,
  gap = 12,
  diamond = { size: 120, left: -30, top: -30 },
  secondDiamond,
  onPress,
  label,
  bg,
  style,
  lattice = true,
}: {
  children: ReactNode;
  radius?: number;
  pad?: number;
  gap?: number;
  diamond?: { size: number; left?: number; top?: number; right?: number; bottom?: number; color?: string } | null;
  secondDiamond?: { size: number; left?: number; top?: number; color?: string };
  onPress?: () => void;
  label?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  lattice?: boolean;
}) {
  const { pc, r } = useTheme();
  const s: ViewStyle = { backgroundColor: bg ?? pc, borderRadius: r(radius), padding: pad, gap, overflow: 'hidden' };
  const inner = (
    <>
      {diamond && <CornerDiamond {...diamond} />}
      {secondDiamond && <CornerDiamond {...secondDiamond} />}
      {lattice && <Lattice />}
      {children}
    </>
  );
  if (onPress) {
    return (
      <Press onPress={onPress} label={label} style={[s, style]}>
        {inner}
      </Press>
    );
  }
  return <View style={[s, style]}>{inner}</View>;
}
