import { z } from 'zod';

import { createLeaseTransfer, createSetupIntent } from '@/lib/server/lease-payments';
import { requireEligibleUser } from '@/lib/server/eligibility';

const bodySchema = z.object({
  listingId: z.string().uuid(), recipientClerkUserId: z.string().min(1), priceCents: z.number().int().positive().max(10_000_000),
  docusignEnvelopeId: z.string().min(1).max(255).optional(), deferredChargeConsent: z.literal(true),
});

export async function POST(request: Request) {
  try {
    const { user, tenant } = await requireEligibleUser(request);
    const input = bodySchema.parse(await request.json());
    const transaction = await createLeaseTransfer({ tenantId: tenant.id, payerClerkUserId: user.clerkUserId, ...input });
    const setupIntent = await createSetupIntent(transaction);
    return Response.json({
      transaction: { id: transaction.id, priceCents: transaction.priceCents, platformFeeCents: transaction.platformFeeCents, currency: transaction.currency, status: 'awaiting_payment_method' },
      setupIntent,
      consent: 'You authorize a one-time future charge only after the agreement and all required approvals are complete. No funds are held in escrow.',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to start payment setup.' }, { status: 400 });
  }
}
