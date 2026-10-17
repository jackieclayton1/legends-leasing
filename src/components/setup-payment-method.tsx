import { ThemedText } from '@/components/themed-text';

/** TypeScript fallback; Metro selects the web/native implementation at runtime. */
export function SetupPaymentMethod(_: { clientSecret: string; onComplete: () => void }) {
  return <ThemedText>Secure payment setup is unavailable on this platform.</ThemedText>;
}
