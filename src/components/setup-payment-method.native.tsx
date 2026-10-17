import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export function SetupPaymentMethod({ clientSecret, onComplete }: { clientSecret: string; onComplete: () => void }) {
  const theme = useTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [ready, setReady] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void initPaymentSheet({ merchantDisplayName: 'Legends Leasing', setupIntentClientSecret: clientSecret, allowsDelayedPaymentMethods: false })
      .then(({ error: setupError }) => {
        if (!active) return;
        setError(setupError?.message ?? null);
        setReady(!setupError);
      });
    return () => { active = false; };
  }, [clientSecret, initPaymentSheet]);

  const collect = async () => {
    setIsPresenting(true);
    setError(null);
    const { error: presentError } = await presentPaymentSheet();
    setIsPresenting(false);
    if (presentError) return setError(presentError.message);
    onComplete();
  };

  return <>
    {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
    <Pressable accessibilityRole="button" disabled={!ready || isPresenting} onPress={() => void collect()} style={({ pressed }) => [styles.button, { backgroundColor: theme.tint }, (pressed || !ready || isPresenting) && styles.dimmed]}>
      {isPresenting ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.label}>{ready ? 'Save payment method' : 'Preparing secure checkout…'}</ThemedText>}
    </Pressable>
  </>;
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderRadius: Spacing.three, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  dimmed: { opacity: 0.65 }, label: { color: '#FFFFFF', fontWeight: '700' },
});
