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
