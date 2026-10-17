import { getVerificationProvider } from '@/lib/server/verification-provider';
import { recordVerificationResult } from '@/lib/server/eligibility';

/** Vendor callback endpoint. Provider-specific signature verification belongs in the adapter. */
export async function POST(request: Request) {
  const provider = getVerificationProvider();
  if (!provider) {
    return Response.json({ error: 'Verification provider is not configured.' }, { status: 503 });
  }

  try {
    const result = await provider.verifyCallback(request);
    await recordVerificationResult(result);
    return Response.json({ received: Boolean(result.providerReference) }, { status: 202 });
  } catch (error) {
    console.error('Verification callback failed', error);
    return Response.json({ error: 'Invalid verification callback.' }, { status: 400 });
  }
}
