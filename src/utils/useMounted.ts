import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * False during server rendering and the first (hydrating) client render, true afterwards.
 * Values that depend on the browser (window size, OS theme, current time) wait for it so the
 * first client render matches the static HTML exactly.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
