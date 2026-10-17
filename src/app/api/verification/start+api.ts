// Replaces src/app/api/verification/start+api.ts in the Expo project.
// Only change: CORS headers + OPTIONS handler so the separately-hosted Vite site can POST here.
// Set ALLOWED_ORIGIN in Vercel (e.g. https://legendsleasing.com); falls back to '*' for dev.
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { findTenantForEmail, markEligibilityPending, recordVerificationResult } from '@/lib/server/eligibility';
import { getVerificationProvider } from '@/lib/server/verification-provider';

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: corsHeaders });

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const tenant = await findTenantForEmail(user.email);
    if (!tenant) return json({ error: 'Your email is not eligible for this tenant.' }, 403);

    const provider = getVerificationProvider();
    if (!provider) {
      return json(
        { status: 'unavailable', message: 'Student verification is not available until the approved provider is configured.' },
        503,
      );
    }

    const start = await provider.start({ tenantSlug: tenant.slug, user });
    if ('result' in start) {
      await recordVerificationResult(start.result);
      return json({ status: 'verified', message: 'Your verified UA email has confirmed your access.' });
    }

    await markEligibilityPending(tenant.id, user.clerkUserId);
    return json({ status: 'started', verificationUrl: start.verificationUrl });
  } catch (error) {
    // requireAuthenticatedUser throws Responses (401/403); add CORS so the browser can read them.
    if (error instanceof Response) {
      const headers = new Headers(error.headers);
      for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
      return new Response(error.body, { status: error.status, headers });
    }
    console.error('Verification start failed', error);
    return json({ error: 'Unable to start verification.' }, 500);
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
