export type EligibilityStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export type EligibilityCategory = 'incoming_freshman' | 'currently_enrolled' | 'recent_graduate';

export type EligibilityResponse = {
  tenant: { slug: string; displayName: string };
  status: EligibilityStatus | 'not_started';
  category: EligibilityCategory | null;
  expiresAt: string | null;
  canAccess: boolean;
};

export type VerificationStartResponse =
  | { status: 'started'; verificationUrl: string }
  | { status: 'verified'; message: string }
  | { status: 'unavailable'; message: string };
