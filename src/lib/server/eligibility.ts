import type { EligibilityResponse, EligibilityStatus } from '@/lib/eligibility';
import { sql } from '@/lib/server/db';
import type { AuthenticatedUser } from '@/lib/server/auth';

type TenantRow = {
  id: string;
  slug: string;
  display_name: string;
};

type EligibilityRow = {
  status: EligibilityStatus;
  category: EligibilityResponse['category'];
  expires_at: string | null;
};

export async function findTenantForEmail(email: string): Promise<TenantRow | null> {
  const domain = email.split('@')[1];
  if (!domain) return null;

  const rows = (await sql()`
    SELECT id, slug, display_name
    FROM tenants
    WHERE is_active = true AND ${domain} = ANY(allowed_email_domains)
    LIMIT 1
  `) as TenantRow[];
  return rows[0] ?? null;
}

export async function getEligibilityForUser(
  user: AuthenticatedUser,
): Promise<{ tenant: TenantRow; eligibility: EligibilityResponse }> {
  const tenant = await findTenantForEmail(user.email);
  if (!tenant) {
    throw new Response(JSON.stringify({ error: 'Your email is not eligible for this tenant.' }), {
      status: 403,
    });
  }

  const rows = (await sql()`
    SELECT status, category, expires_at
    FROM student_eligibilities
    WHERE tenant_id = ${tenant.id} AND clerk_user_id = ${user.clerkUserId}
    ORDER BY updated_at DESC
    LIMIT 1
  `) as EligibilityRow[];
  const record = rows[0];
  const expiresAt = record?.expires_at ?? null;
  const expired = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
  const status = expired ? 'expired' : (record?.status ?? 'not_started');

  return {
    tenant,
    eligibility: {
      tenant: { slug: tenant.slug, displayName: tenant.display_name },
      status,
      category: record?.category ?? null,
      expiresAt,
      canAccess: status === 'verified',
    },
  };
}

export async function requireEligibleUser(request: Request) {
  const { requireAuthenticatedUser } = await import('@/lib/server/auth');
  const user = await requireAuthenticatedUser(request);
  const result = await getEligibilityForUser(user);
  if (!result.eligibility.canAccess) {
    throw new Response(JSON.stringify({ error: 'Current student eligibility is required.' }), {
      status: 403,
    });
  }
  return { user, ...result };
}

export async function markEligibilityPending(tenantId: string, clerkUserId: string) {
  await sql()`
    INSERT INTO student_eligibilities (tenant_id, clerk_user_id, status)
    VALUES (${tenantId}, ${clerkUserId}, 'pending')
    ON CONFLICT (tenant_id, clerk_user_id) DO UPDATE SET
      status = CASE
        WHEN student_eligibilities.status = 'verified'
          AND student_eligibilities.expires_at > now() THEN 'verified'
        ELSE 'pending'
      END,
      updated_at = now()
  `;
}

export async function recordVerificationResult(input: {
  tenantSlug: string;
  clerkUserId: string;
  providerReference: string;
  status: EligibilityStatus;
  category: EligibilityResponse['category'];
  expiresAt: string | null;
}) {
  const tenantRows = (await sql()`
    SELECT id FROM tenants WHERE slug = ${input.tenantSlug} AND is_active = true LIMIT 1
  `) as { id: string }[];
  const tenant = tenantRows[0];
  if (!tenant) throw new Error('Verification callback referenced an unknown tenant.');

  // A verified result is always constrained to a one-year access window, even
  // if a provider callback accidentally supplies a longer date.
  const annualExpiry = new Date();
  annualExpiry.setFullYear(annualExpiry.getFullYear() + 1);
  const providerExpiry = input.expiresAt ? new Date(input.expiresAt) : annualExpiry;
  const expiresAt = input.status === 'verified'
    ? new Date(Math.min(providerExpiry.getTime(), annualExpiry.getTime())).toISOString()
    : null;

  await sql()`
    INSERT INTO student_eligibilities (
      tenant_id, clerk_user_id, provider_reference, status, category, verified_at, expires_at
    ) VALUES (
      ${tenant.id}, ${input.clerkUserId}, ${input.providerReference}, ${input.status},
      ${input.category}, ${input.status === 'verified' ? new Date().toISOString() : null}, ${expiresAt}
    )
    ON CONFLICT (tenant_id, clerk_user_id) DO UPDATE SET
      provider_reference = EXCLUDED.provider_reference,
      status = EXCLUDED.status,
      category = EXCLUDED.category,
      verified_at = EXCLUDED.verified_at,
      expires_at = EXCLUDED.expires_at,
      updated_at = now()
  `;
}
