import { StripeProvider } from '@stripe/stripe-react-native';
import * as Linking from 'expo-linking';
import type { PropsWithChildren } from 'react';

export function PaymentsProvider({ children }: PropsWithChildren) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) return <>{children}</>;
  return <StripeProvider publishableKey={publishableKey} urlScheme={Linking.createURL('')}>
    <>{children}</>
  </StripeProvider>;
}
