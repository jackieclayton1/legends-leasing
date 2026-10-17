import { requireEligibleUser } from '@/lib/server/eligibility';

export async function GET(request: Request) {
  try {
    const { eligibility } = await requireEligibleUser(request);
    return Response.json({ ok: true, eligibility });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: 'Unable to authorize request.' }, { status: 500 });
  }
}
