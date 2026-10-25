import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { ICON } from '@/data/structural';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/theme';

/** Top padding: the prototype reserves 52px for the status bar inside a 390×844 frame. */
export function useTopPad(extra = 8) {
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  return Math.max(insets.top + extra, wide ? 36 : 24);
}

/**
 * Centred content column. On tablets/desktop the prototype keeps a 620/700px column with
 * inline borders next to the side rail; on phones it is full width.
 */
export function Column({ children, bg, style }: { children: ReactNode; bg?: string; style?: StyleProp<ViewStyle> }) {
  const { t } = useTheme();
  const { wide, colW } = useLayout();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center' }}>
      <View
        style={[
          {
            flex: 1,
            width: '100%',
            maxWidth: wide ? colW : undefined,
            backgroundColor: bg ?? t.bg,
            borderStartWidth: wide ? 1 : 0,
            borderEndWidth: wide ? 1 : 0,
            borderColor: t.line,
            overflow: 'hidden',
          },
          style,
        ]}>
        {children}
      </View>
    </View>
  );
}

export interface ScreenProps {
  children: ReactNode;
  /** Fixed area above the scroll view (e.g. green subject header). */
  header?: ReactNode;
  /** Fixed area below the scroll view (sticky CTAs, players, inputs). */
  footer?: ReactNode;
  gap?: number;
  padH?: number;
  padBottom?: number;
  /** Skip the status-bar top padding (when `header` already handles it). */
  noTopPad?: boolean;
  bg?: string;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Overlays rendered above the column (local bottom sheets). */
  overlay?: ReactNode;
  keyboard?: boolean;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollRef?: React.Ref<React.ComponentRef<typeof ScrollView>>;
}

export function Screen({ children, header, footer, gap = 16, padH = 20, padBottom = 20, noTopPad, bg, scroll = true, contentStyle, overlay, keyboard, onScroll, scrollRef }: ScreenProps) {
  const top = useTopPad();
  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={[{ paddingTop: noTopPad ? 16 : top, paddingHorizontal: padH, paddingBottom: padBottom, gap }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      scrollEventThrottle={onScroll ? 16 : undefined}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingTop: noTopPad ? 0 : top, paddingHorizontal: padH, paddingBottom: padBottom, gap }, contentStyle]}>{children}</View>
  );
  const inner = (
    <>
      {header}
      {body}
      {footer}
    </>
  );
  return (
    <Column bg={bg}>
      {keyboard ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
      {overlay}
    </Column>
  );
}

/** Go back to the labelled parent: pops if it is in history, otherwise replaces (direct web loads). */
export function useBackTo(href: Href | string) {
  const router = useRouter();
  return () => router.dismissTo(href as any);
}

/** «‹ label» back link (chevron points right in RTL). */
export function BackLink({ label, href, color, onPress }: { label: string; href?: Href | string; color?: string; onPress?: () => void }) {
  const { t } = useTheme();
  const back = useBackTo((href as Href) ?? '/');
  const c = color ?? t.primary;
  return (
    <Press
      onPress={onPress ?? back}
      label={`رجوع إلى ${label}`}
      style={{ alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon d={ICON.back} size={18} color={c} sw={2.2} directional />
      <Txt size={15} weight={600} color={c}>
        {label}
      </Txt>
    </Press>
  );
}

/** Round 44px back button with a title (settings, qibla map, kaaba). */
export function RoundBackHeader({ title, href, size = 32, right }: { title: string; href: Href | string; size?: number; right?: ReactNode }) {
  const { t } = useTheme();
  const back = useBackTo(href);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <Press
          onPress={back}
          label="رجوع"
          style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon d={ICON.back} size={20} color={t.ink} sw={2.2} directional />
        </Press>
        <Txt font="display" size={size} weight={700} accessibilityRole="header" style={{ flex: 1, flexShrink: 1 }} numberOfLines={2}>
          {title}
        </Txt>
      </View>
      {right && <View style={{ flexShrink: 0 }}>{right}</View>}
    </View>
  );
}

/** Screen title in the display font (32px). */
export function Title({ children, size = 32, align }: { children: ReactNode; size?: number; align?: 'center' }) {
  return (
    <Txt
      font="display"
      size={size}
      weight={700}
      lh={1.5}
      align={align}
      accessibilityRole="header"
      style={{ paddingVertical: 4, marginVertical: 2 }}>
      {children}
    </Txt>
  );
}

/** Muted intro paragraph under titles. */
export function Lead({ children, size = 15 }: { children: ReactNode; size?: number }) {
  const { t } = useTheme();
  return (
    <Txt size={size} color={t.muted} lh={1.8}>
      {children}
    </Txt>
  );
}

/** Small muted footnote. */
export function Note({ children, align }: { children: ReactNode; align?: 'center' }) {
  const { t } = useTheme();
  return (
    <Txt size={14} color={t.muted} lh={1.8} align={align}>
      {children}
    </Txt>
  );
}
