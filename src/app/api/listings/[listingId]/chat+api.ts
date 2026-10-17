import { z } from 'zod';

import { getAIProvider } from '@/lib/server/ai-provider';
import { requireEligibleUser } from '@/lib/server/eligibility';
import { appendThreadMessage, approvedListingContext, getListingForTenant, getOrCreateThread, getThreadHistory } from '@/lib/server/listings';

const bodySchema = z.object({ message: z.string().trim().min(1).max(1_500), threadId: z.string().uuid().optional() });

export async function POST(request: Request, { listingId }: { listingId: string }) {
  try {
    const { user, tenant } = await requireEligibleUser(request);
    const input = bodySchema.parse(await request.json());
    const listing = await getListingForTenant(tenant.id, listingId);
    if (!listing) return Response.json({ error: 'Listing not found.' }, { status: 404 });
    const thread = await getOrCreateThread(listing.id, user.clerkUserId, input.threadId);
    const history = (await getThreadHistory(thread.id)).flatMap((message) => message.role === 'user' || message.role === 'assistant' ? [{ role: message.role, content: message.content } as const] : []);
    await appendThreadMessage({ threadId: thread.id, role: 'user', content: input.message });
    const answer = await getAIProvider().answerListingQuestion({ question: input.message, listingContext: approvedListingContext(listing), history });
    await appendThreadMessage({ threadId: thread.id, role: 'assistant', content: answer.text, citations: answer.citations });
    return Response.json({ threadId: thread.id, message: answer });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to answer the listing question.' }, { status: 400 });
  }
}
