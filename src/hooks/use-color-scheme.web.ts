import { useColorScheme as useRNColorScheme } from 'react-native';

import { useIsClient } from './use-is-client';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const isClient = useIsClient();
  const colorScheme = useRNColorScheme();
  return isClient ? colorScheme : 'light';
}
