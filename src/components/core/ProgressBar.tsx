import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '@/theme/theme';

/**
 * ProgressBar — components/core/ProgressBar.{d.ts,jsx,prompt.md}
 * «شريط تقدّم من 0 إلى 100. light للخلفيات الخضراء.»
 * Props from ProgressBar.d.ts: value (0–100), light. `height`/`color`/`track` cover the 4/5/10px
 * variants on lesson, map and plan screens. Width changes animate (Reanimated CSS transition)
 * unless reduced motion is on.
 */
export interface ProgressBarProps {
  value?: number;
  light?: boolean;
  height?: number;
  color?: string;
  track?: string;
  label?: string;
  animated?: boolean;
}

export function ProgressBar({ value = 0, light = false, height = 6, color, track, label, animated = true }: ProgressBarProps) {
  const { t, gc, reduceMotion } = useTheme();
  const v = Math.max(0, Math.min(100, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v) }}
      style={{ height, borderRadius: 9, backgroundColor: track ?? (light ? 'rgba(255,255,255,0.2)' : t.line), overflow: 'hidden', flexDirection: 'row' }}>
      <Animated.View
        style={{
          height,
          width: `${v}%`,
          borderRadius: 9,
          backgroundColor: color ?? (light ? gc : t.primary),
          transitionProperty: animated && !reduceMotion ? 'width' : 'none',
          transitionDuration: animated && !reduceMotion ? 400 : 0,
        }}
      />
    </View>
  );
}
