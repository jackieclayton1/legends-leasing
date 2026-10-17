import { useAuth, useClerk, useUser } from '@clerk/expo';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { isLoaded: isAuthLoaded } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const { signOut } = useClerk();

  if (!isAuthLoaded || !isUserLoaded) {
    return <ThemedView style={styles.loading}><ActivityIndicator color={theme.tint} /></ThemedView>;
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? 'No primary email available';
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'UA member';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      style={{ backgroundColor: theme.background }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Profile & settings</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">{name}</ThemedText>
          <ThemedText selectable themeColor="textSecondary">{email}</ThemedText>
        </ThemedView>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Account security</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.copy}>
            Your account is secured with a verified UA email code. Sign out on shared devices.
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void signOut()}
            style={({ pressed }) => [styles.button, { backgroundColor: theme.tint }, pressed && styles.buttonPressed]}>
            <ThemedText style={styles.buttonLabel}>Sign out</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { alignItems: 'center', padding: Spacing.four, paddingBottom: BottomTabInset + Spacing.four },
  container: { flex: 1, gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
  card: { borderCurve: 'continuous', borderRadius: Spacing.four, gap: Spacing.two, padding: Spacing.four },
  copy: { lineHeight: 22 },
  button: { alignItems: 'center', borderRadius: Spacing.three, minHeight: 48, justifyContent: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  buttonPressed: { opacity: 0.7 },
  buttonLabel: { color: '#FFFFFF', fontWeight: '700' },
});
