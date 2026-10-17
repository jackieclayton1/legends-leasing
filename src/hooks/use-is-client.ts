import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False during web static/server rendering and hydration, true afterwards.
 * Lets screens that depend on window size render only on the client.
 */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
