/**
 * Console primitives. The console has its own fixed light palette and its own direction (English
 * LTR / Arabic RTL, switched in the top bar), independent of the app's theme and forced RTL.
 * Physical left/right are used for absolute offsets because react-native-web resolves start/end
 * as LTR. Under a `direction`-styled subtree, physical offsets behave the same on native.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { Platform, Pressable, Text, View, type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';

import type { Mutable } from '@/utils/types';

export const C = {
  green: '#145C4B',
  greenDark: '#0C382D',
  greenSoft: '#E7F2EE',
  gold: '#C4A66A',
  goldInk: '#7A5F26',
  goldSoft: '#F6F1E3',
  ivory: '#FAF7F0',
  ink: '#182D29',
  sub: '#5E6E67',
  faint: '#8A9793',
  line: '#E6DFC8',
  lineSoft: '#EFE9DA',
  field: '#D8CFAF',
  sand: '#F3EBD6',
  sandSoft: '#F6F1E3',
  paper: '#FCFAF4',
  muted: '#EFE9DA',
  okBg: '#E4F2EC',
  errBg: '#FBE9E7',
  errInk: '#8A2B1F',
  white: '#FFFFFF',
};

export const F = {
  ui: (w: 400 | 500 | 600 | 700 = 400) =>
    ({ 400: 'IBMPlexSansArabic_400Regular', 500: 'IBMPlexSansArabic_500Medium', 600: 'IBMPlexSansArabic_600SemiBold', 700: 'IBMPlexSansArabic_700Bold' })[w],
  display: 'Amiri_700Bold',
};

export const DirContext = createContext(false);
export const useRtl = () => useContext(DirContext);

/** Inline-start / inline-end as physical offsets for the console's direction. */
export const inline = (rtl: boolean) => ({
  start: (v: number) => (rtl ? { right: v } : { left: v }),
  end: (v: number) => (rtl ? { left: v } : { right: v }),
});

export interface TProps extends TextProps {
  size?: number;
  w?: 400 | 500 | 600 | 700;
  color?: string;
  display?: boolean;
  /** Keep LTR inside Arabic (codes, numbers, «lessons.json»). */
  ltr?: boolean;
}

export function T({ size = 14, w = 400, color = C.ink, display, ltr, style, ...rest }: TProps) {
  const rtl = useRtl() && !ltr;
  const s: Mutable<TextStyle> = { fontFamily: display ? F.display : F.ui(w), fontSize: size, color, writingDirection: rtl ? 'rtl' : 'ltr' };
  const webDir = Platform.OS === 'web' ? ({ dir: rtl ? 'rtl' : 'ltr' } as object) : null;
  return <Text {...webDir} {...rest} style={[s, style]} />;
}

type PState = { pressed: boolean; hovered?: boolean; focused?: boolean };
export interface PProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  hoverStyle?: ViewStyle;
  label?: string;
  children?: ReactNode;
}

/** Pressable with web cursor, hover background and a visible keyboard focus ring. */
export function P({ style, hoverStyle, label, disabled, accessibilityRole, accessibilityState, children, ...rest }: PProps) {
  const a = accessibilityState ?? {};
  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={label}
      accessibilityState={{ ...a, disabled: !!disabled }}
      // react-native-web only maps `disabled` from accessibilityState; expose the rest as ARIA.
      aria-checked={a.checked === undefined ? undefined : !!a.checked}
      aria-selected={a.selected}
      aria-expanded={a.expanded}
      disabled={disabled}
      {...rest}
      style={(st) => {
        const { pressed, hovered, focused } = st as PState;
        const web: Record<string, unknown> = {};
        if (Platform.OS === 'web') {
          web.cursor = disabled ? 'default' : 'pointer';
          if (focused) Object.assign(web, { outlineStyle: 'solid', outlineWidth: 2, outlineColor: C.gold, outlineOffset: 2 });
        }
        return [style, web as ViewStyle, hovered && !disabled ? hoverStyle : null, pressed && !disabled ? { opacity: 0.75 } : null];
      }}>
      {children}
    </Pressable>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <T display size={30} color={C.green} accessibilityRole="header" style={{ lineHeight: 44 }}>
      {children}
    </T>
  );
}

export function Card({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <View
      style={[
        {
          backgroundColor: C.white,
          borderWidth: 1,
          borderColor: C.line,
          borderRadius: 16,
          shadowColor: '#143C30',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export type ChipTone = 'ok' | 'muted' | 'warn' | 'err';
const CHIP: Record<ChipTone, [string, string]> = { ok: [C.okBg, C.green], muted: [C.muted, '#5b625e'], warn: [C.sand, '#6b5416'], err: [C.errBg, C.errInk] };

export function Chip({ tone, children, big }: { tone: ChipTone; children: string; big?: boolean }) {
  const [bg, fg] = CHIP[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingVertical: big ? 5 : 4, paddingHorizontal: big ? 14 : 10, alignSelf: 'flex-start' }}>
      <T size={big ? 12 : 11} w={600} color={fg} numberOfLines={1}>
        {children}
      </T>
    </View>
  );
}

/** Outline / filled pill button used for filters, tabs and exports. */
export function Pill({ label, active, onPress, tone = 'green', round, a11yLabel }: { label: string; active?: boolean; onPress: () => void; tone?: 'green' | 'gold'; round?: boolean; a11yLabel?: string }) {
  const on = tone === 'gold' ? { bg: C.gold, fg: '#2a2008' } : { bg: C.green, fg: C.white };
  const off = { bg: C.white, fg: tone === 'gold' ? C.sub : C.green };
  const s = active ? on : off;
  return (
    <P
      onPress={onPress}
      label={a11yLabel ?? label}
      accessibilityState={{ selected: !!active }}
      style={{ borderRadius: round ? 999 : 10, paddingVertical: 7, paddingHorizontal: round ? 16 : 14, borderWidth: 1, borderColor: active ? on.bg : C.field, backgroundColor: s.bg }}>
      <T size={13} w={500} color={s.fg}>
        {label}
      </T>
    </P>
  );
}

export type BtnKind = 'p' | 'd' | 's';
export function Btn({ label, onPress, kind = 'p', disabled }: { label: string; onPress: () => void; kind?: BtnKind; disabled?: boolean }) {
  const st =
    kind === 'p'
      ? { bg: C.green, fg: C.white, bd: C.green }
      : kind === 'd'
      ? { bg: '#FDF2F0', fg: C.errInk, bd: '#E7B4AB' }
      : { bg: C.white, fg: C.green, bd: '#C9D8D2' };
  return (
    <P
      onPress={onPress}
      disabled={disabled}
      label={label}
      style={{
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: st.bd,
        backgroundColor: st.bg,
        opacity: disabled ? 0.45 : 1,
        minHeight: 46,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <T size={14} w={600} color={st.fg}>
        {label}
      </T>
    </P>
  );
}

/** Dashed empty field — the design's «pending» placeholder. */
export function Slot({ label, value, minH = 20, filled }: { label: string; value: string; minH?: number; filled?: boolean }) {
  return (
    <View>
      <T size={12} color={C.sub} style={{ marginBottom: 4 }}>
        {label}
      </T>
      <View
        style={{
          borderWidth: 1,
          borderStyle: filled ? 'solid' : 'dashed',
          borderColor: C.field,
          borderRadius: 10,
          paddingVertical: 12,
          paddingHorizontal: 14,
          backgroundColor: filled ? C.white : C.paper,
          minHeight: minH + 26,
        }}>
        <T color={filled ? C.ink : C.faint}>{value}</T>
      </View>
    </View>
  );
}

export function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  const rtl = useRtl();
  const x = on ? 23 : 3;
  return (
    <P
      onPress={onPress}
      label={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: on ? C.green : '#cfc8b6' }}>
      <View style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: C.white, ...inline(rtl).start(x) }} />
    </P>
  );
}

export function Checkbox({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return (
    <P onPress={onPress} label={label} accessibilityRole="checkbox" accessibilityState={{ checked }} hitSlop={12} style={{ padding: 2 }}>
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 3,
          borderWidth: 1.5,
          borderColor: checked ? C.green : '#8a8f8b',
          backgroundColor: checked ? C.green : C.white,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {checked ? (
          <T size={11} w={700} color={C.white} style={{ lineHeight: 13 }}>
            ✓
          </T>
        ) : null}
      </View>
    </P>
  );
}
