/**
 * Design tokens — source: design-source tokens/colors.css, tokens/spacing.css,
 * tokens/typography.css and the palettes defined in `Baseerah Prototype.dc.html` (renderVals).
 */
import { mix } from '@/utils/color';

export const brand = {
  green: '#145C4B',
  greenNight: '#0E2A25',
  greenSoft: '#E3EFEA',
  gold: '#C4A66A',
  goldInk: '#7A5F26',
  goldSoft: '#F4ECD8',
  ivory: '#FAF8F2',
  card: '#FFFFFF',
  ink: '#182D29',
  muted: '#5B6B67',
  line: '#E6E1D2',
  lock: '#EFEBDD',
  err: '#9A2E22',
  errBg: '#F9E4E0',
  // Values used by the prototype that are not in tokens/*.css
  onGreenMuted: '#CFE0DA',
  onGreenFaint: '#E4EEEA',
  failBg: '#8A3A2E',
  failRing: '#F0C9C2',
  danger: '#B8412F',
  wrongBg: '#FDF3F1',
  wrongBorder: '#E7B4AB',
  lockedRow: '#F6F3EA',
  lockedRowNight: '#102F29',
  khushuBg: '#0B201C',
  khushuMuted: '#9DB3AD',
  sepiaBg: '#F1E6CF',
  sepiaCard: '#F8EFDB',
  toast: '#182D29',
  scrim: 'rgba(10,24,21,.5)',
  scrimLight: 'rgba(10,24,21,.45)',
} as const;

export const space = { s1: 8, s2: 12, s3: 16, s4: 20, s5: 24, screenPad: 20, tap: 44 } as const;

export const radius = { button: 14, card: 20, sheet: 28, pill: 99 } as const;

export const shadow = {
  card: '0px 2px 14px rgba(24,45,41,0.10)',
  cardNight: '0px 2px 14px rgba(0,0,0,0.4)',
  float: '0px 6px 16px rgba(0,0,0,0.14)',
  frame: '0px 20px 50px rgba(24,45,41,0.3)',
} as const;

export const motion = {
  /** --ease: cubic-bezier(.2,.8,.2,1) */
  ease: [0.2, 0.8, 0.2, 1] as const,
  sheetMs: 250,
  toastMs: 2200,
  pulseMs: 1200,
} as const;

export const type = {
  caption: 13,
  chip: 15,
  body: 17,
  card: 21,
  title: 30,
  lhUi: 1.7,
  lhReading: 2.1,
} as const;

export type MoodName = 'وقار' | 'نور' | 'واحة' | 'حبر';
export type OrnamentLevel = 'بلا' | 'هادئة' | 'غنية';
export type CardStyleName = 'حدود' | 'ظل' | 'مظلّل';
export type DisplayFont = 'amiri' | 'plex' | 'naskh' | 'tajawal';

/** MOODS — primary, gold, background, heading font and radius scale change together. */
export const MOODS: Record<MoodName, { pc: string; gc: string; bg: string; hf: DisplayFont; rs: number }> = {
  وقار: { pc: '#145C4B', gc: '#C4A66A', bg: '#FAF8F2', hf: 'amiri', rs: 1 },
  نور: { pc: '#243B6B', gc: '#D9A441', bg: '#F3F5FA', hf: 'plex', rs: 1.35 },
  واحة: { pc: '#8A4B2F', gc: '#C98B3A', bg: '#FBF4EA', hf: 'naskh', rs: 1.6 },
  حبر: { pc: '#22262B', gc: '#A8844A', bg: '#FFFFFF', hf: 'tajawal', rs: 0.35 },
};

export const ORNAMENT: Record<OrnamentLevel, { dOp: number; patOp: number; wOp: number }> = {
  بلا: { dOp: 0, patOp: 0, wOp: 0 },
  هادئة: { dOp: 1, patOp: 0, wOp: 0.12 },
  غنية: { dOp: 1, patOp: 0.16, wOp: 0.22 },
};

export interface Palette {
  bg: string;
  card: string;
  ink: string;
  body: string;
  muted: string;
  line: string;
  primary: string;
  soft: string;
  goldSoft: string;
  goldInk: string;
  lockBg: string;
  btn: string;
  btnText: string;
  errBg: string;
  errInk: string;
  /** Text drawn on a primary-filled control. */
  onPrimary: string;
}

export function buildPalette(opts: { dark: boolean; highContrast: boolean; pc: string; gc: string; bg: string }): Palette {
  const { dark, highContrast, pc, gc, bg } = opts;
  const t: Palette = dark
    ? {
        bg: '#0E2A25',
        card: '#14362F',
        ink: '#F1EEE4',
        body: '#CBD8D3',
        muted: '#9DB3AD',
        line: '#25463F',
        primary: '#6FD0B3',
        soft: '#1B433A',
        goldSoft: '#2B3A2E',
        goldInk: '#E3C98D',
        lockBg: '#1B3B34',
        btn: gc,
        btnText: '#182D29',
        errBg: '#3A1F1B',
        errInk: '#F0A99D',
        onPrimary: '#0E2A25',
      }
    : {
        bg,
        card: '#FFFFFF',
        ink: '#182D29',
        body: '#2A403B',
        muted: '#5B6B67',
        line: '#E6E1D2',
        primary: pc,
        soft: mix(pc, 12, '#FFFFFF'),
        goldSoft: mix(gc, 20, '#FFFFFF'),
        goldInk: '#7A5F26',
        lockBg: '#EFEBDD',
        btn: pc,
        btnText: '#FFFFFF',
        errBg: '#F9E4E0',
        errInk: '#9A2E22',
        onPrimary: '#FFFFFF',
      };
  if (highContrast) {
    Object.assign(
      t,
      dark ? { muted: '#D5E5E0', line: '#4E7A6F', body: '#F1EEE4' } : { muted: '#2F403C', line: '#9A937F', body: '#182D29' },
    );
  }
  return t;
}

export interface CardSurface {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  boxShadow?: string;
}

export function cardSurface(style: CardStyleName, t: Palette, dark: boolean): CardSurface {
  if (style === 'ظل') {
    return { backgroundColor: t.card, borderColor: 'transparent', borderWidth: 1, boxShadow: dark ? shadow.cardNight : shadow.card };
  }
  if (style === 'مظلّل') return { backgroundColor: t.soft, borderColor: 'transparent', borderWidth: 1 };
  return { backgroundColor: t.card, borderColor: t.line, borderWidth: 1 };
}

/** App-level theme configuration (designer "tweak" props — not user settings). */
export const THEME_CONFIG: { mood: MoodName; ornament: OrnamentLevel; cardStyle: CardStyleName } = {
  mood: 'وقار',
  ornament: 'هادئة',
  cardStyle: 'ظل',
};

export const FONT_SCALES = [1, 1.12, 1.25] as const;
export const LH_BODY = [1.8, 2.1, 2.4] as const;
export const LH_BOOK = [1.9, 2.2, 2.5] as const;
export const BOOK_FS = [17, 19, 22] as const;
