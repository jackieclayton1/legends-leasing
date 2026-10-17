import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, useColorScheme } from 'react-native';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AccessGate } from '@/components/access-gate';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AccessGate>
        <AppTabs />
      </AccessGate>
    </ThemeProvider>
  );

  if (!publishableKey) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <ThemedView style={styles.missingConfig}>
          <ThemedText type="title">Authentication setup required</ThemedText>
          <ThemedText themeColor="textSecondary">
            Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to enable UA student access.
          </ThemedText>
        </ThemedView>
      </ThemeProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {content}
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  missingConfig: { flex: 1, gap: Spacing.two, justifyContent: 'center', padding: Spacing.four },
});
