import { searchFiltersSchema } from '@/lib/search';
import { searchPublishedListings } from '@/lib/server/listings';
import { requireEligibleUser } from '@/lib/server/eligibility';

export async function POST(request: Request) {
  try {
    const { tenant } = await requireEligibleUser(request);
    const filters = searchFiltersSchema.parse(await request.json());
    return Response.json({ filters, listings: await searchPublishedListings(tenant.id, filters) });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to search listings.' }, { status: 400 });
  }
}
