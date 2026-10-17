-- Payment references only. Card data and signed agreement contents never enter this database.
CREATE TABLE IF NOT EXISTS lease_transfer_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  payer_clerk_user_id text NOT NULL,
  recipient_clerk_user_id text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents > 0),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = 'usd'),
  platform_fee_bps integer NOT NULL DEFAULT 500 CHECK (platform_fee_bps = 500),
  platform_fee_cents integer NOT NULL CHECK (platform_fee_cents >= 0),
  stripe_customer_id text,
  stripe_setup_intent_id text,
  stripe_payment_method_id text,
  stripe_connect_account_id text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  stripe_refund_id text,
  payment_consent_at timestamptz NOT NULL,
  docusign_envelope_id text,
  agreement_status text NOT NULL DEFAULT 'pending' CHECK (agreement_status IN ('pending', 'completed', 'declined', 'expired')),
  property_approval_status text NOT NULL DEFAULT 'pending' CHECK (property_approval_status IN ('pending', 'approved', 'rejected', 'needs_more_info')),
  recipient_readiness_status text NOT NULL DEFAULT 'pending' CHECK (recipient_readiness_status IN ('pending', 'ready', 'restricted')),
  status text NOT NULL DEFAULT 'awaiting_payment_method' CHECK (status IN ('awaiting_payment_method', 'awaiting_agreement', 'awaiting_property_approval', 'awaiting_recipient', 'awaiting_sca', 'processing', 'completed', 'cancelled', 'cancellation_review', 'refund_pending', 'refunded', 'failed')),
  cancellation_reason text,
  cancellation_requested_at timestamptz,
  cancellation_reviewed_by text,
  cancellation_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (payer_clerk_user_id <> recipient_clerk_user_id)
);

CREATE INDEX IF NOT EXISTS lease_transfer_transactions_tenant_participant_idx
  ON lease_transfer_transactions (tenant_id, payer_clerk_user_id, recipient_clerk_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS lease_transfer_transactions_listing_idx
  ON lease_transfer_transactions (listing_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS lease_transfer_transactions_setup_intent_idx
  ON lease_transfer_transactions (stripe_setup_intent_id) WHERE stripe_setup_intent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS lease_transfer_transactions_payment_intent_idx
  ON lease_transfer_transactions (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  stripe_account_id text NOT NULL UNIQUE,
  readiness_status text NOT NULL DEFAULT 'pending' CHECK (readiness_status IN ('pending', 'ready', 'restricted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, clerk_user_id)
);

CREATE TABLE IF NOT EXISTS lease_transfer_provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES lease_transfer_transactions(id) ON DELETE SET NULL,
  provider text NOT NULL CHECK (provider IN ('stripe', 'docusign', 'resend', 'workflow')),
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS lease_transfer_provider_events_transaction_idx
  ON lease_transfer_provider_events (transaction_id, received_at DESC);

CREATE TABLE IF NOT EXISTS lease_transfer_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES lease_transfer_transactions(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('property_manager', 'support')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_more_info', 'expired')),
  decision_note text,
  otp_hash text,
  otp_expires_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transaction_id, kind)
);
