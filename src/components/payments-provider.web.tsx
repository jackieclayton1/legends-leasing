import type { PropsWithChildren } from 'react';

/** The web checkout owns its Stripe Elements provider per SetupIntent. */
export function PaymentsProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}
