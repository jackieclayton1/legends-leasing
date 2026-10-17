import { getEligibilityForUser } from '@/lib/server/eligibility';
import { requireAuthenticatedUser } from '@/lib/server/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { eligibility } = await getEligibilityForUser(user);
    return Response.json(eligibility, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Eligibility lookup failed', error);
    return Response.json({ error: 'Unable to load eligibility.' }, { status: 500, headers: corsHeaders });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
