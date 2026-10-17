import { recordStripeEvent } from '@/lib/server/lease-payments';
import { verifyStripeSignature } from '@/lib/server/stripe';

type StripeEvent = { id: string; type: string; data: { object?: { metadata?: Record<string, string>; id?: string; payment_method?: string; status?: string; charges_enabled?: boolean; payouts_enabled?: boolean } } };

export async function POST(request: Request) {
  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get('stripe-signature'))) {
    return Response.json({ error: 'Invalid Stripe signature.' }, { status: 400 });
  }
  try {
    await recordStripeEvent(JSON.parse(payload) as StripeEvent);
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: 'Unable to record webhook event.' }, { status: 500 });
  }
}
