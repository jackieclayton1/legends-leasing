import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const stripePromise = loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

function Form({ onComplete }: { onComplete: () => void }) {
  const theme = useTheme();
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (!stripe || !elements) return;
    setIsSubmitting(true);
    setError(null);
    const result = await stripe.confirmSetup({ elements, confirmParams: { return_url: window.location.href }, redirect: 'if_required' });
    setIsSubmitting(false);
    if (result.error) return setError(result.error.message ?? 'Unable to save payment method.');
    onComplete();
  };
  return <>
    <PaymentElement />
    {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
    <Pressable accessibilityRole="button" disabled={!stripe || isSubmitting} onPress={() => void submit()} style={({ pressed }) => [styles.button, { backgroundColor: theme.tint }, (pressed || isSubmitting) && styles.dimmed]}>
      {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.label}>Save payment method</ThemedText>}
    </Pressable>
  </>;
}

export function SetupPaymentMethod({ clientSecret, onComplete }: { clientSecret: string; onComplete: () => void }) {
  if (!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) return <ThemedText>Stripe checkout is not configured for this environment.</ThemedText>;
  return <Elements stripe={stripePromise} options={{ clientSecret }}><Form onComplete={onComplete} /></Elements>;
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderRadius: Spacing.three, marginTop: Spacing.three, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  dimmed: { opacity: 0.65 }, label: { color: '#FFFFFF', fontWeight: '700' },
});
