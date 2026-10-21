/**
 * Worklet port of the easing + `animate()` helpers from animations-v3.jsx, so timelines run on
 * the UI thread with Reanimated. Semantics match the original: hold `from` before `start`,
 * `to` after `end`.
 */
export type EaseName = 'linear' | 'easeOutCubic' | 'easeInOutCubic' | 'easeOutBack';

export function ease(name: EaseName, t: number): number {
  'worklet';
  switch (name) {
    case 'easeOutCubic':
      return 1 - Math.pow(1 - t, 3);
    case 'easeInOutCubic':
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case 'easeOutBack': {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    default:
      return t;
  }
}

export function animate(t: number, start: number, end: number, name: EaseName = 'easeInOutCubic', from = 0, to = 1): number {
  'worklet';
  if (t <= start) return from;
  if (t >= end) return to;
  return from + (to - from) * ease(name, (t - start) / (end - start));
}

/** MOTION from the intro: enter = easeOutCubic, draw = easeInOutCubic, pop = easeOutBack. */
export function enter(t: number, s: number, e: number) {
  'worklet';
  return animate(t, s, e, 'easeOutCubic');
}
export function draw(t: number, s: number, e: number) {
  'worklet';
  return animate(t, s, e, 'easeInOutCubic');
}
export function pop(t: number, s: number, e: number) {
  'worklet';
  return animate(t, s, e, 'easeOutBack');
}
export function clamp01(v: number) {
  'worklet';
  return Math.max(0, Math.min(1, v));
}

/** OM_SCENES of `Baseerah Intro Vertical.html` (total 24s). */
export const SCENES = [
  { name: 'Logo', dur: 4 },
  { name: 'Promise', dur: 5 },
  { name: 'Academy', dur: 6 },
  { name: 'Trust', dur: 5 },
  { name: 'Close', dur: 4 },
] as const;
export const CUES = { Logo: 0, Promise: 4, Academy: 9, Trust: 15, Close: 20 } as const;
export const INTRO_TOTAL = 24;
