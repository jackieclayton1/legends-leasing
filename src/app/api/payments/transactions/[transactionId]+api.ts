import { z } from 'zod';

import { requestCancellation, transactionForParticipant } from '@/lib/server/lease-payments';
import { requireEligibleUser } from '@/lib/server/eligibility';

const bodySchema = z.object({ reason: z.string().trim().min(5).max(1_000) });

export async function GET(request: Request, { transactionId }: { transactionId: string }) {
  try {
    const { user, tenant } = await requireEligibleUser(request);
    const transaction = await transactionForParticipant(tenant.id, user.clerkUserId, transactionId);
    if (!transaction) return Response.json({ error: 'Transaction not found.' }, { status: 404 });
    return Response.json({ transaction: {
      id: transaction.id, priceCents: transaction.priceCents, platformFeeCents: transaction.platformFeeCents, currency: transaction.currency,
      status: transaction.status, agreementStatus: transaction.agreementStatus, propertyApprovalStatus: transaction.propertyApprovalStatus,
      recipientReadinessStatus: transaction.recipientReadinessStatus, cancellationReason: transaction.cancellationReason,
    } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: 'Unable to retrieve transaction.' }, { status: 400 });
  }
}

export async function DELETE(request: Request, { transactionId }: { transactionId: string }) {
  try {
    const { user, tenant } = await requireEligibleUser(request);
    const transaction = await transactionForParticipant(tenant.id, user.clerkUserId, transactionId);
    if (!transaction) return Response.json({ error: 'Transaction not found.' }, { status: 404 });
    const input = bodySchema.parse(await request.json());
    const status = await requestCancellation(transaction, input.reason);
    return Response.json({ status, message: status === 'cancelled' ? 'The transfer was cancelled before agreement completion; no charge was created.' : 'Your cancellation request is awaiting support review under the agreement terms.' });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to request cancellation.' }, { status: 400 });
  }
}
