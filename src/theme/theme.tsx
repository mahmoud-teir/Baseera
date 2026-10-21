import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useApp } from '@/state/app-store';
import { useMounted } from '@/utils/useMounted';

import { fontFamilyFor, type FontRole, type Weight } from './fonts';
import {
  buildPalette,
  cardSurface,
  FONT_SCALES,
  LH_BODY,
  LH_BOOK,
  MOODS,
  ORNAMENT,
  THEME_CONFIG,
  type CardSurface,
  type DisplayFont,
  type Palette,
} from './tokens';

export interface Theme {
  t: Palette;
  dark: boolean;
  /** Mood primary (pc) and gold (gc) — used on green surfaces regardless of dark mode. */
  pc: string;
  gc: string;
  rs: number;
  hf: DisplayFont;
  dOp: number;
  patOp: number;
  wOp: number;
  cs: CardSurface;
  /** Whole-UI text scale from the «حجم الخط» setting (×1 / ×1.12 / ×1.25). */
  scale: number;
  lhBody: number;
  lhBook: number;
  reduceMotion: boolean;
  /** Radius scaled by the mood's radius factor, like `calc(Npx * rs)`. */
  r: (n: number) => number;
  font: (role: FontRole, weight?: Weight) => string;
}

const ThemeCtx = createContext<Theme | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const mounted = useMounted();
  const osScheme = useColorScheme();
  const osReducedRaw = useReducedMotion();
  // OS preferences are unknown while hydrating static HTML; use the light, full-motion defaults first.
  const os = mounted ? osScheme : 'light';
  const osReduced = mounted ? osReducedRaw : false;
  const darkPref = useApp((s) => s.dark);
  const hc = useApp((s) => s.hc);
  const fs = useApp((s) => s.fs);
  const ls = useApp((s) => s.ls);
  const rm = useApp((s) => s.rm);

  const theme = useMemo<Theme>(() => {
    const mood = MOODS[THEME_CONFIG.mood];
    const orn = ORNAMENT[THEME_CONFIG.ornament];
    const dark = darkPref ?? os === 'dark';
    const t = buildPalette({ dark, highContrast: hc, pc: mood.pc, gc: mood.gc, bg: mood.bg });
    return {
      t,
      dark,
      pc: mood.pc,
      gc: mood.gc,
      rs: mood.rs,
      hf: mood.hf,
      ...orn,
      cs: cardSurface(THEME_CONFIG.cardStyle, t, dark),
      scale: FONT_SCALES[fs],
      lhBody: LH_BODY[ls],
      lhBook: LH_BOOK[ls],
      reduceMotion: rm ?? osReduced,
      r: (n: number) => n * mood.rs,
      font: (role: FontRole, weight: Weight = 400) => fontFamilyFor(role, weight, mood.hf),
    };
  }, [darkPref, os, hc, fs, ls, rm, osReduced]);

  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Theme {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error('useTheme must be used inside ThemeProvider');
  return v;
}
