import { interpretSearchSchema, searchFiltersSchema } from '@/lib/search';
import { getAIProvider } from '@/lib/server/ai-provider';
import { requireEligibleUser } from '@/lib/server/eligibility';

export async function POST(request: Request) {
  try {
    await requireEligibleUser(request);
    const input = interpretSearchSchema.parse(await request.json());
    const filters = searchFiltersSchema.parse(await getAIProvider().interpretSearch(input));
    return Response.json({ filters });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to interpret search.' }, { status: 400 });
  }
}
