import { useAuth, useClerk, useSignIn, useSignUp } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { getEligibility, startVerification } from '@/lib/auth-api';
import type { EligibilityResponse } from '@/lib/eligibility';
import { isUaEmail, uaEmailPlaceholder } from '@/lib/ua-email';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

function messageFrom(error: unknown) {
  if (typeof error === 'object' && error && 'errors' in error) {
    const errors = (error as { errors?: { longMessage?: string; message?: string }[] }).errors;
    return errors?.[0]?.longMessage ?? errors?.[0]?.message ?? 'Unable to continue.';
  }
  return error instanceof Error ? error.message : 'Unable to continue.';
}

function EmailOtpSignIn() {
  const theme = useTheme();
  const { fetchStatus: signInFetchStatus, signIn } = useSignIn();
  const { fetchStatus: signUpFetchStatus, signUp } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'email' | 'password' | 'code'>('email');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isUaEmail(normalizedEmail)) {
      setError('Use a verified @ua.edu or @crimson.ua.edu email address.');
      return;
    }
    if (!signIn || !signUp) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await signIn.create({
        identifier: normalizedEmail,
        signUpIfMissing: true,
      });
      if (result.error) throw result.error;

      if (signIn.isTransferable) {
        const signUpResult = await signUp.create({ transfer: true });
        if (signUpResult.error) throw signUpResult.error;
        setIsSigningUp(true);
        setPhase('password');
      } else {
        const codeResult = await signIn.emailCode.sendCode();
        if (codeResult.error) throw codeResult.error;
        setIsSigningUp(false);
        setPhase('code');
      }
    } catch (signInError) {
      setError(messageFrom(signInError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPasswordAndSendCode = async () => {
    if (!signUp) return;
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const signUpResult = await signUp.password({
        emailAddress: email.trim().toLowerCase(),
        password,
      });
      if (signUpResult.error) throw signUpResult.error;
      const codeResult = await signUp.verifications.sendEmailCode();
      if (codeResult.error) throw codeResult.error;
      setPhase('code');
    } catch (signUpError) {
      setError(messageFrom(signUpError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (!signIn || !signUp) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = isSigningUp
        ? await signUp.verifications.verifyEmailCode({ code })
        : await signIn.emailCode.verifyCode({ code });
      if (result.error) throw result.error;
      const finalized = isSigningUp ? await signUp.finalize() : await signIn.finalize();
      if (finalized.error) throw finalized.error;
    } catch (verificationError) {
      setError(messageFrom(verificationError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GateShell>
      <ThemedText type="title">UA student access</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.copy}>
        Sign in or create an account with your UA email. New students create a password, then verify by email. This is not UA official SSO.
      </ThemedText>
      <View style={styles.form}>
        {phase === 'email' ? (
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder={uaEmailPlaceholder}
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]}
            value={email}
          />
        ) : phase === 'password' ? (
          <TextInput
            autoComplete="new-password"
            onChangeText={setPassword}
            placeholder="Create a password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]}
            value={password}
          />
        ) : (
          <TextInput
            autoComplete="one-time-code"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setCode}
            placeholder="6-digit code"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]}
            value={code}
          />
        )}
        {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting || signInFetchStatus === 'fetching' || signUpFetchStatus === 'fetching'}
          onPress={() => void (phase === 'email' ? sendCode() : phase === 'password' ? createPasswordAndSendCode() : verifyCode())}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.tint },
            (pressed || isSubmitting) && styles.buttonPressed,
          ]}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.buttonLabel}>
              {phase === 'email'
                ? 'Continue with UA email'
                : phase === 'password'
                  ? 'Create account'
                  : 'Verify code'}
            </ThemedText>
          )}
        </Pressable>
        {phase !== 'email' ? (
          <Pressable onPress={() => {
            setCode('');
            setPassword('');
            setPhase('email');
          }}>
            <ThemedText type="link">Use a different email</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </GateShell>
  );
}

function EligibilityGate({ children }: PropsWithChildren) {
  const theme = useTheme();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Your session token is unavailable. Please sign in again.');
      setEligibility(await getEligibility(token));
    } catch (requestError) {
      setEligibility(null);
      setError(messageFrom(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, refresh]);

  if (!isLoaded) {
    return <GateShell><ActivityIndicator color={theme.tint} /></GateShell>;
  }
  if (!isSignedIn) return <EmailOtpSignIn />;
  if (isLoading) return <GateShell><ActivityIndicator color={theme.tint} /></GateShell>;
  if (eligibility?.canAccess) return <>{children}</>;

  const requestVerification = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Your session token is unavailable. Please sign in again.');
      const result = await startVerification(token);
      if (result.status === 'started') {
        await WebBrowser.openBrowserAsync(result.verificationUrl);
        await refresh();
      } else if (result.status === 'verified') {
        await refresh();
      } else {
        setError(result.message);
      }
    } catch (startError) {
      setError(messageFrom(startError));
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <GateShell>
      <ThemedText type="title">Eligibility required</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.copy}>
        {eligibility?.status === 'expired'
          ? 'Your student eligibility has expired. Renew it to regain access.'
          : eligibility?.status === 'rejected'
            ? 'Your verification was not approved. Contact support or try again when available.'
            : 'Your account is signed in, but student eligibility has not been verified yet.'}
      </ThemedText>
      {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
      <Pressable
        accessibilityRole="button"
        disabled={isStarting}
        onPress={() => void requestVerification()}
        style={({ pressed }) => [styles.button, { backgroundColor: theme.tint }, (pressed || isStarting) && styles.buttonPressed]}>
        {isStarting ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.buttonLabel}>Verify student status</ThemedText>}
      </Pressable>
      <Pressable onPress={() => void signOut()}>
        <ThemedText type="link">Sign out</ThemedText>
      </Pressable>
    </GateShell>
  );
}

function GateShell({ children }: PropsWithChildren) {
  const theme = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={{ backgroundColor: theme.background }}>
      <ThemedView type="backgroundElement" style={styles.card}>{children}</ThemedView>
    </ScrollView>
  );
}

export function AccessGate({ children }: PropsWithChildren) {
  return <EligibilityGate>{children}</EligibilityGate>;
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, paddingBottom: BottomTabInset + Spacing.four },
  card: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three, padding: Spacing.four, borderRadius: Spacing.four, borderCurve: 'continuous' },
  copy: { lineHeight: 22 },
  form: { gap: Spacing.two },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Spacing.two, fontSize: 16, paddingHorizontal: Spacing.three, paddingVertical: 14 },
  button: { alignItems: 'center', borderRadius: Spacing.three, minHeight: 48, justifyContent: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  buttonPressed: { opacity: 0.7 },
  buttonLabel: { color: '#FFFFFF', fontWeight: '700' },
});
