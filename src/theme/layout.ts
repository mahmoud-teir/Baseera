import { I18nManager, Platform, useWindowDimensions } from 'react-native';

import { useMounted } from '@/utils/useMounted';

/** Breakpoints from the prototype's device modes: phone 390 · tablet 768 (col 620) · landscape 1180 (col 700). */
export const BP = { tablet: 768, desktop: 1180 } as const;
export const SIDE_RAIL_WIDTH = 150;
export const TAB_BAR_HEIGHT = 84;

export function useLayout() {
  const dims = useWindowDimensions();
  const mounted = useMounted();
  // Static web HTML is rendered at phone size; switch to the real size after hydration.
  const { width, height } = Platform.OS === 'web' && !mounted ? { width: 390, height: 844 } : dims;
  const wide = width >= BP.tablet;
  const colW = width >= BP.desktop ? 700 : wide ? 620 : width;
  return { width, height, wide, colW, desktop: width >= BP.desktop };
}

/** The app is Arabic-only and always laid out right-to-left. */
export function isRTL(): boolean {
  return Platform.OS === 'web' ? true : I18nManager.isRTL;
}

/**
 * Logical offsets for absolute positioning. Native (forced RTL) resolves `start`/`end` to the
 * right/left edges; react-native-web resolves them as LTR, so on the web the physical edge is
 * used directly. `start` = the reading-start (right) edge, `end` = the left edge.
 */
export const edge = {
  start: (v: number) => (Platform.OS === 'web' ? { right: v } : { start: v }),
  end: (v: number) => (Platform.OS === 'web' ? { left: v } : { end: v }),
  borderEnd: (w: number) => (Platform.OS === 'web' ? { borderLeftWidth: w } : { borderEndWidth: w }),
};
