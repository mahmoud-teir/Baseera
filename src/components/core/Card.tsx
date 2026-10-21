import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Press } from './Press';

/**
 * Card — components/core/Card.{d.ts,jsx,prompt.md}
 * «بطاقة بثلاثة أنماط: حدود أو ظل أو مظلّلة.»
 * Props from Card.d.ts: variant ('border'|'shadow'|'tint'), pad (16), onClick, children.
 * `variant="app"` follows the app-wide card style (`cs` in the prototype).
 */
export interface CardProps {
  variant?: 'border' | 'shadow' | 'tint' | 'app';
  pad?: number;
  onClick?: () => void;
  onPress?: () => void;
  children?: ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  label?: string;
}

export function Card({ variant = 'border', pad = 16, onClick, onPress, children, radius = 20, style, label }: CardProps) {
  const { t, r, cs, dark } = useTheme();
  const surface: ViewStyle =
    variant === 'app'
      ? { backgroundColor: cs.backgroundColor, borderColor: cs.borderColor, borderWidth: cs.borderWidth, boxShadow: cs.boxShadow }
      : variant === 'shadow'
        ? { backgroundColor: t.card, borderColor: 'transparent', borderWidth: 1, boxShadow: dark ? '0px 2px 14px rgba(0,0,0,0.4)' : '0px 2px 14px rgba(24,45,41,0.10)' }
        : variant === 'tint'
          ? { backgroundColor: t.soft, borderColor: 'transparent', borderWidth: 1 }
          : { backgroundColor: t.card, borderColor: t.line, borderWidth: 1 };
  const base: ViewStyle = { ...surface, borderRadius: r(radius), padding: pad };
  const handler = onPress ?? onClick;
  if (handler) {
    return (
      <Press onPress={handler} label={label} style={[base, style]}>
        {children}
      </Press>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
