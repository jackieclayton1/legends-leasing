import { createHmac, timingSafeEqual } from 'node:crypto';

type StripeObject = Record<string, unknown> & { id: string };

function stripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.');
  const environment = process.env.STRIPE_ENVIRONMENT;
  if ((key.startsWith('sk_live_') && environment !== 'live') || (key.startsWith('sk_test_') && environment === 'live')) {
    throw new Error('Stripe key and STRIPE_ENVIRONMENT do not match.');
  }
  return key;
}

function formBody(values: Record<string, string | number | boolean | undefined>) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined) form.set(key, String(value));
  return form;
}

export async function stripePost<T extends StripeObject>(path: string, values: Record<string, string | number | boolean | undefined>, idempotencyKey: string): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': idempotencyKey,
    },
    body: formBody(values),
  });
  const body = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? `Stripe request failed (${response.status}).`);
  return body;
}

export function verifyStripeSignature(payload: string, header: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const fields = header.split(',').map((part) => part.split('=', 2));
  const timestamp = fields.find(([key]) => key === 't')?.[1];
  const signatures = fields.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || signatures.length === 0 || Math.abs(Date.now() / 1_000 - Number(timestamp)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return signatures.some((signature) => {
    const actual = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
  });
}
