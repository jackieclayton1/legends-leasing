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
 * A Clerk-verified UA address is the selected development verifier. It works in
 * Expo web, iOS, and Android without a vendor redirect, and is only reached
 * after `requireAuthenticatedUser` confirms the primary Clerk email is verified.
 *
 * Replace this with a vetted SheerID or Student Beans adapter when that vendor's
 * credentials, callback signature verification, and UA coverage are approved.
 */
class VerifiedUaEmailProvider implements StudentVerificationProvider {
  async start({ tenantSlug, user }: { tenantSlug: string; user: AuthenticatedUser }): Promise<VerificationStart> {
    return {
      result: {
        tenantSlug,
        clerkUserId: user.clerkUserId,
        providerReference: `clerk-verified-email:${user.clerkUserId}`,
        status: 'verified',
        category: null,
        expiresAt: null,
      },
    };
  }

  async verifyCallback(): Promise<ProviderResult> {
    throw new Error('The verified-UA-email provider does not use callbacks.');
  }
}

export function getVerificationProvider(): StudentVerificationProvider | null {
  return new VerifiedUaEmailProvider();
}
