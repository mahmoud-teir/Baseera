import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Press } from './Press';
import { Txt } from './Txt';

/**
 * Button — components/core/Button.{d.ts,jsx,prompt.md}
 * «زر أساسي أو ثانوي أو مقفل بارتفاع 48 واستدارة 14.»
 * Props from Button.d.ts: variant ('primary'|'secondary'), disabled, full, onClick, children.
 * `onPress` is accepted as the React Native alias of `onClick`. `size` reproduces the taller CTAs
 * used on screens (52px quiz/lesson CTAs, 56px welcome/result CTAs). `tone="ivory"` is the light
 * button used on green surfaces.
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  full?: boolean;
  onClick?: () => void;
  onPress?: () => void;
  children?: ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'sm';
  tone?: 'default' | 'ivory' | 'outlineLight';
  /** Text colour override for ivory buttons (result screen uses the fail red). */
  textColor?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}

const SIZES = {
  sm: { h: 44, fs: 16, w: 600 as const },
  md: { h: 48, fs: 17, w: 600 as const },
  lg: { h: 52, fs: 19, w: 700 as const },
  xl: { h: 56, fs: 19, w: 700 as const },
};

export function Button({
  variant = 'primary',
  disabled = false,
  full = false,
  onClick,
  onPress,
  children,
  size = 'md',
  tone = 'default',
  textColor,
  label,
  style,
  radius,
}: ButtonProps) {
  const { t, r, pc } = useTheme();
  const sz = SIZES[size];
  let bg: string;
  let fg: string;
  let border: ViewStyle = { borderWidth: 0 };
  if (disabled) {
    bg = t.lockBg;
    fg = t.muted;
  } else if (tone === 'ivory') {
    bg = '#FAF8F2';
    fg = textColor ?? pc;
  } else if (tone === 'outlineLight') {
    bg = 'transparent';
    fg = '#FFFFFF';
    border = { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)' };
  } else if (variant === 'secondary') {
    bg = 'transparent';
    fg = t.primary;
    border = { borderWidth: 1.5, borderColor: t.primary };
  } else {
    bg = t.btn;
    fg = t.btnText;
  }
  const weight = variant === 'secondary' || tone === 'outlineLight' ? 600 : sz.w;
  return (
    <Press
      onPress={disabled ? undefined : (onPress ?? onClick)}
      disabled={disabled}
      label={label ?? (typeof children === 'string' ? children : undefined)}
      style={[
        {
          minHeight: sz.h,
          paddingHorizontal: 22,
          borderRadius: radius ?? r(size === 'md' ? 14 : 16),
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: full ? 'stretch' : 'auto',
        },
        border,
        style,
      ]}>
      {typeof children === 'string' ? (
        <Txt size={sz.fs} weight={weight} color={fg} align="center">
          {children}
        </Txt>
      ) : (
        children
      )}
    </Press>
  );
}
