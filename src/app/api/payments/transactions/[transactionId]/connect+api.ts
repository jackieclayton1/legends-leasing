import { createConnectOnboardingLink, transactionForParticipant } from '@/lib/server/lease-payments';
import { requireEligibleUser } from '@/lib/server/eligibility';

export async function POST(request: Request, { transactionId }: { transactionId: string }) {
  try {
    const { user, tenant } = await requireEligibleUser(request);
    const transaction = await transactionForParticipant(tenant.id, user.clerkUserId, transactionId);
    if (!transaction || transaction.recipientClerkUserId !== user.clerkUserId) return Response.json({ error: 'Recipient transaction not found.' }, { status: 404 });
    const onboarding = await createConnectOnboardingLink(transaction);
    return Response.json(onboarding);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to start recipient onboarding.' }, { status: 400 });
  }
}
