import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/react';
import { getEligibility, startVerification } from '@/lib/auth-api';
import { SCHOOL } from '@/lib/school';

const AuthContext = createContext(null);

export function clerkErrorMessage(error) {
  if (error && typeof error === 'object' && 'errors' in error) {
    const first = error.errors?.[0];
    if (first) return first.longMessage ?? first.message ?? 'Unable to continue.';
  }
  return error instanceof Error ? error.message : 'Unable to continue.';
}

export function AuthProvider({ children }) {
  const { getToken, isLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const [eligibility, setEligibility] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [eligibilityError, setEligibilityError] = useState(null);

  const refreshEligibility = useCallback(async () => {
    if (!isSignedIn) return null;
    setFetching(true);
    setEligibilityError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Your session token is unavailable. Please sign in again.');
      const result = await getEligibility(token);
      setEligibility(result);
      return result;
    } catch (error) {
      setEligibility(null);
      setEligibilityError(clerkErrorMessage(error));
      return null;
    } finally {
      setFetching(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setEligibility(null);
      setEligibilityError(null);
      return;
    }
    refreshEligibility();
  }, [isLoaded, isSignedIn, refreshEligibility]);

  // Runs POST /api/verification/start. With the current "verified UA email" provider this
  // verifies immediately; a vendor provider would return a URL to redirect to.
  const verifyStudent = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Your session token is unavailable. Please sign in again.');
    const result = await startVerification(token);
    if (result.status === 'started' && result.verificationUrl) {
      window.location.href = result.verificationUrl;
      return result;
    }
    if (result.status === 'unavailable') throw new Error(result.message);
    await refreshEligibility();
    return result;
  }, [getToken, refreshEligibility]);

  const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? '';
  const user = useMemo(
    () =>
      isSignedIn && clerkUser
        ? {
            id: clerkUser.id,
            email,
            name: clerkUser.fullName || clerkUser.firstName || email.split('@')[0] || 'Student',
            university: SCHOOL.fullName,
          }
        : null,
    [isSignedIn, clerkUser, email],
  );

  const value = {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    user,
    eligibility,
    canAccess: Boolean(eligibility?.canAccess),
    // true while signed in and the first eligibility lookup hasn't finished
    eligibilityLoading: fetching || (Boolean(isSignedIn) && !eligibility && !eligibilityError),
    eligibilityError,
    refreshEligibility,
    verifyStudent,
    logout: () => signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
