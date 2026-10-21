import { useEffect, type ReactNode } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { Easing, FadeIn, Keyframe } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme';

/** `bsUp .25s ease-out`: translateY(40px) + fade → rest. */
const bsUp = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 40 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.ease) },
}).duration(250);

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Fraction of the container height (prototype: .9 evidence, .88 report, .8 map, .75 ayah). */
  maxHeight?: number;
  label: string;
  z?: number;
  scrim?: string;
}

/**
 * Bottom sheet — radius 28 top corners, drag handle, 45–50% scrim, slide-up .25s (HANDOFF §4).
 * Closes on scrim tap, Android back, and Escape on the web.
 */
export function BottomSheet({ visible, onClose, children, maxHeight = 0.9, label, z = 30, scrim = 'rgba(10,24,21,0.5)' }: BottomSheetProps) {
  const { t, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    let onKey: ((e: KeyboardEvent) => void) | undefined;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      onKey = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', onKey);
    }
    return () => {
      sub.remove();
      if (onKey) window.removeEventListener('keydown', onKey);
    };
  }, [visible, onClose]);

  if (!visible) return null;
  return (
    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: z }} pointerEvents="box-none">
      <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(200)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: scrim }}>
        <Pressable accessibilityRole="button" accessibilityLabel="إغلاق" onPress={onClose} style={{ flex: 1 }} />
      </Animated.View>
      <Animated.View
        entering={reduceMotion ? undefined : bsUp}
        accessibilityViewIsModal
        aria-modal
        accessibilityLabel={label}
        role="dialog"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          alignSelf: 'center',
          marginHorizontal: 'auto',
          width: '100%',
          maxWidth: 720,
          maxHeight: `${maxHeight * 100}%`,
          backgroundColor: t.card,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: 'hidden',
        }}>
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 24 + insets.bottom, gap: 12 }}>
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 9, backgroundColor: t.line }} />
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
