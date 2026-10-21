import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Press } from './Press';
import { Txt } from './Txt';

/**
 * Chip — components/core/Chip.{d.ts,jsx,prompt.md}  «شريحة حالة أو فلتر.»
 * Props from Chip.d.ts: label, active, tone ('green'|'gold'), onClick.
 * `outline` renders the prototype's filter chips (border primary, filled when active).
 */
export interface ChipProps {
  label: string;
  active?: boolean;
  tone?: 'green' | 'gold';
  onClick?: () => void;
  onPress?: () => void;
  outline?: boolean;
  height?: number;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
  /** Non-interactive status pill. */
  static?: boolean;
}

export function Chip({ label, active = false, tone = 'green', onClick, onPress, outline, height = 44, fontSize = 15, style, static: isStatic }: ChipProps) {
  const { t } = useTheme();
  let bg: string;
  let fg: string;
  let border: ViewStyle = { borderWidth: 0 };
  if (outline) {
    bg = active ? t.primary : 'transparent';
    fg = active ? t.onPrimary : t.primary;
    border = { borderWidth: 1, borderColor: t.primary };
  } else {
    bg = active ? t.btn : tone === 'gold' ? t.goldSoft : t.soft;
    fg = active ? t.btnText : tone === 'gold' ? t.goldInk : t.primary;
  }
  const s: ViewStyle = {
    backgroundColor: bg,
    borderRadius: 99,
    minHeight: height,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...border,
  };
  const handler = onPress ?? onClick;
  return (
    <Press
      onPress={handler}
      disabled={isStatic || !handler}
      accessibilityRole={isStatic ? 'text' : 'button'}
      accessibilityState={{ selected: active }}
      label={label}
      style={[s, style]}>
      <Txt size={fontSize} weight={600} color={fg}>
        {label}
      </Txt>
    </Press>
  );
}
