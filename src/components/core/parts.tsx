/** Small building blocks that recur across the prototype's screens. */
import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { ICON } from '@/data/structural';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';
import type { ChainData } from '@/data/content';

import { Icon } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';

/** Segmented control (qChips / planChips / stChips / settings choices ≤ 3). */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  height = 42,
  fontSize = 16,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  height?: number;
  fontSize?: number;
  label?: string;
}) {
  const { t, r } = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: r(16), backgroundColor: t.soft }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Press
            key={String(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            label={o.label}
            onPress={() => onChange(o.value)}
            style={{ flex: 1, minHeight: height, borderRadius: r(12), backgroundColor: on ? t.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={fontSize} weight={600} color={on ? t.onPrimary : t.primary}>
              {o.label}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

/** Wrapping outline chips (settings choices > 3 options, report reasons, filters). */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  radius = 99,
  height = 44,
  borderWidth = 1.5,
  flex,
  fontSize = 15,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  radius?: number;
  height?: number;
  borderWidth?: number;
  flex?: boolean;
  fontSize?: number;
}) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: flex ? 'nowrap' : 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Press
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, checked: on }}
            label={o.label}
            onPress={() => onChange(o.value)}
            style={{
              flex: flex ? 1 : undefined,
              minHeight: height,
              paddingHorizontal: flex ? 4 : 16,
              borderRadius: radius,
              borderWidth,
              borderColor: t.primary,
              backgroundColor: on ? t.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Txt size={fontSize} weight={600} color={on ? t.onPrimary : t.primary}>
              {o.label}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

/** 52×30 switch from the settings screen. */
export function Toggle({ on }: { on: boolean }) {
  const { t } = useTheme();
  return (
    <View
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        backgroundColor: on ? t.primary : t.line,
        paddingHorizontal: 3,
        justifyContent: 'center',
        alignItems: on ? 'flex-end' : 'flex-start',
      }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', boxShadow: '0px 1px 3px rgba(0,0,0,0.3)' }} />
    </View>
  );
}

/** Conic progress ring (adhkar counter) drawn with SVG so it works on every platform. */
export function Ring({ pct, size = 72, stroke = 8, color, track, children }: { pct: number; size?: number; stroke?: number; color: string; track: string; children?: ReactNode }) {
  const rr = (size - stroke) / 2;
  const c = 2 * Math.PI * rr;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={rr} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={rr}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, pct / 100)))}
        />
      </Svg>
      {children}
    </View>
  );
}

/** Skeleton block with the `bsPulse` animation (opacity .55 ↔ 1, 1.2s). */
export function Skeleton({ height, style }: { height: number; style?: StyleProp<ViewStyle> }) {
  const { t, r, reduceMotion } = useTheme();
  const o = useSharedValue(0.55);
  useEffect(() => {
    if (reduceMotion) return;
    o.value = withRepeat(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [o, reduceMotion]);
  const a = useAnimatedStyle(() => ({ opacity: reduceMotion ? 1 : o.value }));
  return <Animated.View accessibilityLabel="جارٍ التحميل" style={[{ height, borderRadius: r(18), backgroundColor: t.line }, a, style]} />;
}

/** Rotated-square number badge (surah / ayah numbers). */
export function Diamond({ n, size = 38, color, textColor, fontSize = 15 }: { n: number | string; size?: number; color: string; textColor?: string; fontSize?: number }) {
  const { t } = useTheme();
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size * 0.82,
          height: size * 0.82,
          borderWidth: 1.5,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <Txt size={fontSize} weight={600} color={textColor ?? t.ink}>
        {n}
      </Txt>
    </View>
  );
}

/** Small outlined diamond bullet. */
export function DiamondBullet({ size = 12, color }: { size?: number; color: string }) {
  return <View style={{ width: size, height: size, borderWidth: 1.5, borderColor: color, transform: [{ rotate: '45deg' }] }} />;
}

/** Dashed gold «pending verification» slot. */
export function PendingSlot({ children, size = 14, radius = 12 }: { children: ReactNode; size?: number; radius?: number }) {
  const { t, gc } = useTheme();
  return (
    <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: gc, borderRadius: radius, padding: 10 }}>
      <Txt size={size} color={t.goldInk} lh={1.8}>
        {children}
      </Txt>
    </View>
  );
}

/** Dashed neutral empty state. */
export function EmptyState({ children }: { children: ReactNode }) {
  const { t, r } = useTheme();
  return (
    <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.line, borderRadius: r(20), paddingVertical: 28, paddingHorizontal: 18 }}>
      <Txt size={16} color={t.muted} lh={1.8} align="center">
        {children}
      </Txt>
    </View>
  );
}

/** «اعرف الدليل» (opens the evidence chain) + «أبلغ عن خطأ» (opens the report sheet). */
export function EvidenceActions({ where, data, chain = true, reportLabel = 'أبلغ عن خطأ' }: { where: string; data?: ChainData; chain?: boolean; reportLabel?: string }) {
  const { t, gc } = useTheme();
  const openChain = useUi((s) => s.openChain);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
      {chain && (
        <Press
          onPress={() => openChain(where, data)}
          label={`اعرف الدليل · ${where}`}
          style={{ minHeight: 44, paddingHorizontal: 14, borderWidth: 1.5, borderColor: gc, borderRadius: 99, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon d={ICON.link} size={14} color={t.goldInk} />
          <Txt size={14} weight={700} color={t.goldInk}>
            اعرف الدليل
          </Txt>
        </Press>
      )}
      <ReportLink where={where} label={reportLabel} />
    </View>
  );
}

export function ReportLink({ where, label = 'أبلغ عن خطأ' }: { where: string; label?: string }) {
  const { t } = useTheme();
  const openReport = useUi((s) => s.openReport);
  return (
    <Press
      onPress={() => openReport(where)}
      label={`أبلغ عن خطأ · ${where}`}
      style={{ minHeight: 44, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
      <Icon d={ICON.flag} size={14} color={t.muted} />
      <Txt size={14} weight={600} color={t.muted}>
        {label}
      </Txt>
    </Press>
  );
}

/** Section header with a trailing text action («عرض الكل»). */
export function SectionHeader({ title, actions }: { title: string; actions?: { label: string; onPress: () => void; gold?: boolean }[] }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
      <Txt size={19} weight={600} accessibilityRole="header">
        {title}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        {actions?.map((a) => (
          <Press key={a.label} onPress={a.onPress} label={`${a.label} · ${title}`} style={{ minHeight: 32, justifyContent: 'center' }}>
            <Txt size={14} weight={600} color={a.gold ? t.goldInk : t.primary}>
              {a.label}
            </Txt>
          </Press>
        ))}
      </View>
    </View>
  );
}

/** 36–52px rounded icon tile. */
export function IconTile({ d, size = 44, iconSize = 24, bg, color, radius = 14, sw = 1.8 }: { d: string; size?: number; iconSize?: number; bg: string; color: string; radius?: number; sw?: number }) {
  const { r } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: r(radius), backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon d={d} size={iconSize} color={color} sw={sw} />
    </View>
  );
}

/** Static coloured pill (badges like «موثّق», «7 صحيحة»). */
export function Pill({ label, bg, fg, size = 14, ltr }: { label: string; bg: string; fg: string; size?: number; ltr?: boolean }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 99, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start' }}>
      <Txt size={size} weight={600} color={fg} ltr={ltr}>
        {label}
      </Txt>
    </View>
  );
}

/** Numbered / checked step circle (plan items, path steps). */
export function StepMark({ done, n, size = 36 }: { done: boolean; n: number; size?: number }) {
  const { t } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: done ? t.primary : 'transparent',
        borderWidth: 1.5,
        borderColor: done ? t.primary : t.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Txt size={16} color={done ? t.onPrimary : t.muted}>
        {done ? '✓' : n}
      </Txt>
    </View>
  );
}
