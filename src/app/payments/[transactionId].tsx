import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { SetupPaymentMethod } from '@/components/setup-payment-method';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PaymentSetupScreen() {
  const theme = useTheme();
  const { transactionId, setupIntentClientSecret } = useLocalSearchParams<{ transactionId: string; setupIntentClientSecret: string }>();
  const [complete, setComplete] = useState(false);
  if (!transactionId || !setupIntentClientSecret) return <ThemedView style={styles.missing}><ThemedText>Open payment setup from an approved transfer offer.</ThemedText></ThemedView>;
  return <ScrollView style={{ backgroundColor: theme.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
    <ThemedView style={styles.container}>
      <ThemedText type="title">Save payment method</ThemedText>
      <ThemedText themeColor="textSecondary">You authorize one future charge for this transfer only after the signed agreement, property approval, and recipient onboarding are complete. Legends Leasing does not hold funds in escrow.</ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        {complete ? <><ThemedText type="subtitle">Payment method saved</ThemedText><ThemedText themeColor="textSecondary">We’ll ask you to complete any required bank authentication before a final charge. You can track agreement and approval status here.</ThemedText></> : <SetupPaymentMethod clientSecret={setupIntentClientSecret} onComplete={() => setComplete(true)} />}
      </ThemedView>
    </ThemedView>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: 'center', padding: Spacing.four, paddingBottom: BottomTabInset + Spacing.four },
  container: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  card: { gap: Spacing.three, padding: Spacing.four, borderRadius: Spacing.four, borderCurve: 'continuous' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
});
