import { boolean, date, doublePrecision, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  displayName: text('display_name').notNull(),
  allowedEmailDomains: text('allowed_email_domains').array().notNull(),
  branding: jsonb('branding').notNull(),
  enabledVerificationRules: jsonb('enabled_verification_rules').notNull(),
  contentPartitionKey: text('content_partition_key').notNull().unique(),
  ssoMetadata: jsonb('sso_metadata').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const studentEligibilities = pgTable('student_eligibilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull(),
  providerReference: text('provider_reference'),
  status: text('status').notNull(),
  category: text('category'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const listings = pgTable('listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  ownerClerkUserId: text('owner_clerk_user_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  address: text('address').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  monthlyRentCents: integer('monthly_rent_cents').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: doublePrecision('bathrooms').notNull(),
  availableFrom: date('available_from').notNull(),
  availableUntil: date('available_until').notNull(),
  furnished: boolean('furnished').notNull().default(false),
  petsAllowed: boolean('pets_allowed').notNull().default(false),
  accessibilityTags: text('accessibility_tags').array().notNull().default([]),
  amenities: text('amenities').array().notNull().default([]),
  busRoutes: text('bus_routes').array().notNull().default([]),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const chatThreads = pgTable('chat_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').notNull().references(() => chatThreads.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  citations: jsonb('citations').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

/** Durable records only; no workflow runner or automated approval is enabled in v1. */
export const verificationCases = pgTable('verification_cases', {
  id: uuid('id').defaultRandom().primaryKey(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('not_started'),
  reviewerClerkUserId: text('reviewer_clerk_user_id'),
  decision: text('decision'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

/** Provider references and transaction states only — never card, credit, or document contents. */
export const leaseTransferTransactions = pgTable('lease_transfer_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'restrict' }),
  payerClerkUserId: text('payer_clerk_user_id').notNull(),
  recipientClerkUserId: text('recipient_clerk_user_id').notNull(),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('usd'),
  platformFeeBps: integer('platform_fee_bps').notNull().default(500),
  platformFeeCents: integer('platform_fee_cents').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSetupIntentId: text('stripe_setup_intent_id'),
  stripePaymentMethodId: text('stripe_payment_method_id'),
  stripeConnectAccountId: text('stripe_connect_account_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeTransferId: text('stripe_transfer_id'),
  stripeRefundId: text('stripe_refund_id'),
  paymentConsentAt: timestamp('payment_consent_at', { withTimezone: true }).notNull(),
  docusignEnvelopeId: text('docusign_envelope_id'),
  agreementStatus: text('agreement_status').notNull().default('pending'),
  propertyApprovalStatus: text('property_approval_status').notNull().default('pending'),
  recipientReadinessStatus: text('recipient_readiness_status').notNull().default('pending'),
  status: text('status').notNull().default('awaiting_payment_method'),
  cancellationReason: text('cancellation_reason'),
  cancellationRequestedAt: timestamp('cancellation_requested_at', { withTimezone: true }),
  cancellationReviewedBy: text('cancellation_reviewed_by'),
  cancellationReviewedAt: timestamp('cancellation_reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const leaseTransferProviderEvents = pgTable('lease_transfer_provider_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').references(() => leaseTransferTransactions.id, { onDelete: 'set null' }),
  provider: text('provider').notNull(),
  providerEventId: text('provider_event_id').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull().default({}),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
});

/** One Stripe Connect Express account per recipient within a tenant. */
export const stripeConnectAccounts = pgTable('stripe_connect_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull(),
  stripeAccountId: text('stripe_account_id').notNull(),
  readinessStatus: text('readiness_status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const leaseTransferApprovals = pgTable('lease_transfer_approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').notNull().references(() => leaseTransferTransactions.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  status: text('status').notNull().default('pending'),
  decisionNote: text('decision_note'),
  otpHash: text('otp_hash'),
  otpExpiresAt: timestamp('otp_expires_at', { withTimezone: true }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
