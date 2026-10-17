import type { EligibilityCategory, EligibilityStatus } from '@/lib/eligibility';
import type { AuthenticatedUser } from '@/lib/server/auth';

export type ProviderResult = {
  tenantSlug: string;
  clerkUserId: string;
  providerReference: string;
  status: EligibilityStatus;
  category: EligibilityCategory | null;
  expiresAt: string | null;
};

export type VerificationStart =
  | { verificationUrl: string }
  | { result: ProviderResult };

export interface StudentVerificationProvider {
  start(input: { tenantSlug: string; user: AuthenticatedUser }): Promise<VerificationStart>;
  verifyCallback(request: Request): Promise<ProviderResult>;
}

/**
 * This is a deliberate local mock of the SheerID completion step. It is reached
 * only after `requireAuthenticatedUser` has confirmed a verified UA email, then
 * records a normal provider reference/status so all later authorization behaves
 * exactly as it will with the real provider.
 *
 * Replace this with a vetted SheerID or Student Beans adapter when that vendor's
 * credentials, callback signature verification, and UA coverage are approved.
 */
class MockSheerIdEmailProvider implements StudentVerificationProvider {
  async start({ tenantSlug, user }: { tenantSlug: string; user: AuthenticatedUser }): Promise<VerificationStart> {
    return {
      result: {
        tenantSlug,
        clerkUserId: user.clerkUserId,
        providerReference: `mock-sheerid:clerk-verified-email:${user.clerkUserId}`,
        status: 'verified',
        category: null,
        expiresAt: null,
      },
    };
  }

  async verifyCallback(): Promise<ProviderResult> {
    throw new Error('The mock SheerID provider does not use callbacks.');
  }
}

export function getVerificationProvider(): StudentVerificationProvider | null {
  return new MockSheerIdEmailProvider();
}
