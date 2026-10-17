import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiUrl, getHealth, type HealthResponse } from '@/lib/api';

export default function HomeScreen() {
  const theme = useTheme();
  const [result, setResult] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkApi = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setResult(await getHealth());
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : 'Unable to reach the API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void checkApi(), 0);
    return () => clearTimeout(timer);
  }, [checkApi]);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Connected app</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.description}>
          This screen calls an Expo Router API route that is deployed alongside the web app.
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">GET {apiUrl('/api/health')}</ThemedText>

          {isLoading ? (
            <ThemedView style={styles.statusRow}>
              <ActivityIndicator color={theme.tint} />
              <ThemedText themeColor="textSecondary">Contacting API…</ThemedText>
            </ThemedView>
          ) : error ? (
            <ThemedText selectable style={[styles.status, { color: theme.danger }]}>
              {error}
            </ThemedText>
          ) : (
            <ThemedView style={styles.response}>
              <ThemedText type="subtitle" selectable>
                {result?.message}
              </ThemedText>
              <ThemedText selectable themeColor="textSecondary">
                Status: {result?.status} · {result?.timestamp}
              </ThemedText>
            </ThemedView>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call API again"
            disabled={isLoading}
            onPress={() => void checkApi()}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.tint },
              (pressed || isLoading) && styles.buttonPressed,
            ]}>
            <ThemedText style={styles.buttonLabel}>Call API</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary">
          Set EXPO_PUBLIC_API_URL to your Vercel URL to use the deployed API from a native dev
          build. Leave it unset to call the local Expo server.
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  container: { flex: 1, gap: Spacing.four, maxWidth: MaxContentWidth },
  description: { lineHeight: 22 },
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderCurve: 'continuous',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  status: { lineHeight: 22 },
  response: { gap: Spacing.one },
  button: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  buttonPressed: { opacity: 0.7 },
  buttonLabel: { color: '#FFFFFF', fontWeight: '700' },
});
