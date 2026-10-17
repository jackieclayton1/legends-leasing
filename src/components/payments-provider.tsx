import type { PropsWithChildren } from 'react';

/** TypeScript fallback; Metro selects the web/native implementation at runtime. */
export function PaymentsProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}
