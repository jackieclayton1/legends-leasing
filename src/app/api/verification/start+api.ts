import { requireAuthenticatedUser } from '@/lib/server/auth';
import { findTenantForEmail, markEligibilityPending, recordVerificationResult } from '@/lib/server/eligibility';
import { getVerificationProvider } from '@/lib/server/verification-provider';

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const tenant = await findTenantForEmail(user.email);
    if (!tenant) return Response.json({ error: 'Your email is not eligible for this tenant.' }, { status: 403 });

    const provider = getVerificationProvider();
    if (!provider) {
      return Response.json(
        {
          status: 'unavailable',
          message: 'Student verification is not available until the approved provider is configured.',
        },
        { status: 503 },
      );
    }

    const start = await provider.start({ tenantSlug: tenant.slug, user });
    if ('result' in start) {
      await recordVerificationResult(start.result);
      return Response.json({
        status: 'verified',
        message: 'Your verified UA email has confirmed your access.',
      });
    }

    await markEligibilityPending(tenant.id, user.clerkUserId);
    return Response.json({ status: 'started', verificationUrl: start.verificationUrl });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Verification start failed', error);
    return Response.json({ error: 'Unable to start verification.' }, { status: 500 });
  }
}
