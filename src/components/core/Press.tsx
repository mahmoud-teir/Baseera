import { forwardRef, type ComponentRef } from 'react';
import { Platform, Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';

export interface PressProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Accessible name; defaults to the visible text for text buttons. */
  label?: string;
}

/**
 * Pressable with the design's interaction rules: press = slight dim (no scale),
 * hover and keyboard focus rings on the web, 44px minimum handled by callers.
 */
export const Press = forwardRef<ComponentRef<typeof View>, PressProps>(function Press({ style, label, disabled, accessibilityRole, ...rest }, ref) {
  const { t } = useTheme();
  return (
    <Pressable
      ref={ref}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      style={(state) => {
        const { pressed } = state;
        const hovered = (state as unknown as { hovered?: boolean }).hovered;
        const focused = (state as unknown as { focused?: boolean }).focused;
        const web: ViewStyle = {};
        if (Platform.OS === 'web') {
          (web as Record<string, unknown>).cursor = disabled ? 'default' : 'pointer';
          if (focused) {
            (web as Record<string, unknown>).outlineStyle = 'solid';
            (web as Record<string, unknown>).outlineWidth = 2;
            (web as Record<string, unknown>).outlineColor = t.primary;
            (web as Record<string, unknown>).outlineOffset = 2;
          }
        }
        return [style, web, pressed && !disabled ? { opacity: 0.7 } : hovered && !disabled ? { opacity: 0.88 } : null];
      }}
    />
  );
});
