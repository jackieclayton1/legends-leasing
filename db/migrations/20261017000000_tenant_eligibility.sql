CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  allowed_email_domains text[] NOT NULL DEFAULT '{}',
  branding jsonb NOT NULL DEFAULT '{}',
  enabled_verification_rules jsonb NOT NULL DEFAULT '{}',
  content_partition_key text NOT NULL UNIQUE,
  sso_metadata jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_eligibilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  provider_reference text,
  status text NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  category text CHECK (category IN ('incoming_freshman', 'currently_enrolled', 'recent_graduate')),
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, clerk_user_id)
);

CREATE INDEX IF NOT EXISTS student_eligibilities_access_idx
  ON student_eligibilities (tenant_id, clerk_user_id, status, expires_at);

INSERT INTO tenants (
  slug, display_name, allowed_email_domains, branding,
  enabled_verification_rules, content_partition_key, sso_metadata
) VALUES (
  'ua', 'The University of Alabama', ARRAY['ua.edu', 'crimson.ua.edu'],
  '{"primaryColor":"#9E1B32"}',
  '{"incoming_freshman":true,"currently_enrolled":true,"recent_graduate":true}',
  'ua', '{}'
) ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  allowed_email_domains = EXCLUDED.allowed_email_domains,
  branding = EXCLUDED.branding,
  enabled_verification_rules = EXCLUDED.enabled_verification_rules;
