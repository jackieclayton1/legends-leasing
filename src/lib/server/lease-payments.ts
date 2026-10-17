import { and, eq, or } from 'drizzle-orm';

import { db } from '@/lib/server/db';
import { leaseTransferProviderEvents, leaseTransferTransactions, listings, stripeConnectAccounts } from '@/lib/server/schema';
import { stripePost } from '@/lib/server/stripe';

const feeBasisPoints = 500;

export function calculatePlatformFeeCents(priceCents: number) {
  return Math.round((priceCents * feeBasisPoints) / 10_000);
}

export async function createLeaseTransfer(input: { tenantId: string; listingId: string; payerClerkUserId: string; recipientClerkUserId: string; priceCents: number; docusignEnvelopeId?: string }) {
  const listing = await db().select({ id: listings.id, ownerClerkUserId: listings.ownerClerkUserId })
    .from(listings).where(and(eq(listings.id, input.listingId), eq(listings.tenantId, input.tenantId))).limit(1);
  if (!listing[0]) throw new Response(JSON.stringify({ error: 'Listing not found.' }), { status: 404 });
  if (listing[0].ownerClerkUserId !== input.recipientClerkUserId) throw new Response(JSON.stringify({ error: 'Recipient must be the listing owner.' }), { status: 403 });
  if (input.payerClerkUserId === input.recipientClerkUserId) throw new Response(JSON.stringify({ error: 'Payer and recipient must be different people.' }), { status: 400 });

  const rows = await db().insert(leaseTransferTransactions).values({
    tenantId: input.tenantId, listingId: input.listingId, payerClerkUserId: input.payerClerkUserId,
    recipientClerkUserId: input.recipientClerkUserId, priceCents: input.priceCents,
    platformFeeBps: feeBasisPoints, platformFeeCents: calculatePlatformFeeCents(input.priceCents),
    docusignEnvelopeId: input.docusignEnvelopeId, paymentConsentAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
  }).returning();
  return rows[0];
}

export async function createSetupIntent(transaction: typeof leaseTransferTransactions.$inferSelect) {
  let customerId = transaction.stripeCustomerId;
  if (!customerId) {
    const customer = await stripePost('/customers', { 'metadata[lease_transfer_transaction_id]': transaction.id }, `lease-customer:${transaction.id}`);
    customerId = customer.id;
    await db().update(leaseTransferTransactions).set({ stripeCustomerId: customerId, updatedAt: new Date() }).where(eq(leaseTransferTransactions.id, transaction.id));
  }
  const intent = await stripePost('/setup_intents', {
    customer: customerId, usage: 'off_session', 'payment_method_types[]': 'card',
    'metadata[lease_transfer_transaction_id]': transaction.id,
    'metadata[consent]': 'deferred_charge_after_agreement_and_required_approvals',
  }, `lease-setup-intent:${transaction.id}`);
  await db().update(leaseTransferTransactions).set({ stripeSetupIntentId: intent.id, status: 'awaiting_payment_method', updatedAt: new Date() }).where(eq(leaseTransferTransactions.id, transaction.id));
  return { id: intent.id, clientSecret: String(intent.client_secret ?? '') };
}

export async function transactionForParticipant(tenantId: string, clerkUserId: string, transactionId: string) {
  const rows = await db().select().from(leaseTransferTransactions).where(and(
    eq(leaseTransferTransactions.id, transactionId), eq(leaseTransferTransactions.tenantId, tenantId),
    or(eq(leaseTransferTransactions.payerClerkUserId, clerkUserId), eq(leaseTransferTransactions.recipientClerkUserId, clerkUserId)),
  )).limit(1);
  return rows[0] ?? null;
}

export async function requestCancellation(transaction: typeof leaseTransferTransactions.$inferSelect, reason: string) {
  const beforeAgreement = transaction.agreementStatus !== 'completed';
  await db().update(leaseTransferTransactions).set({
    status: beforeAgreement ? 'cancelled' : 'cancellation_review', cancellationReason: reason,
    cancellationRequestedAt: new Date(), updatedAt: new Date(),
  }).where(eq(leaseTransferTransactions.id, transaction.id));
  return beforeAgreement ? 'cancelled' : 'cancellation_review';
}

export async function createConnectOnboardingLink(transaction: typeof leaseTransferTransactions.$inferSelect) {
  let accountId = transaction.stripeConnectAccountId;
  if (!accountId) {
    const existing = await db().select().from(stripeConnectAccounts).where(and(
      eq(stripeConnectAccounts.tenantId, transaction.tenantId),
      eq(stripeConnectAccounts.clerkUserId, transaction.recipientClerkUserId),
    )).limit(1);
    accountId = existing[0]?.stripeAccountId;
    if (!accountId) {
      const account = await stripePost('/accounts', {
        type: 'express', 'capabilities[transfers][requested]': true,
        'metadata[tenant_id]': transaction.tenantId,
        'metadata[recipient_clerk_user_id]': transaction.recipientClerkUserId,
      }, `lease-connect-account:${transaction.tenantId}:${transaction.recipientClerkUserId}`);
      accountId = account.id;
      await db().insert(stripeConnectAccounts).values({
        tenantId: transaction.tenantId, clerkUserId: transaction.recipientClerkUserId,
        stripeAccountId: accountId, createdAt: new Date(), updatedAt: new Date(),
      }).onConflictDoNothing();
    }
    await db().update(leaseTransferTransactions).set({ stripeConnectAccountId: accountId, updatedAt: new Date() }).where(eq(leaseTransferTransactions.id, transaction.id));
  }
  const appUrl = process.env.APP_URL?.replace(/\/$/, '');
  if (!appUrl) throw new Error('APP_URL is required for Stripe Connect onboarding redirects.');
  const link = await stripePost(`/accounts/${accountId}/account_links`, {
    refresh_url: `${appUrl}/payments/${transaction.id}?connect=refresh`,
    return_url: `${appUrl}/payments/${transaction.id}?connect=return`,
    type: 'account_onboarding',
  }, `lease-connect-link:${transaction.id}:${Math.floor(Date.now() / 60_000)}`);
  return { accountId, onboardingUrl: String(link.url ?? '') };
}

/** Called only by the future durable workflow after every prerequisite is recorded. */
export async function chargeApprovedTransfer(transaction: typeof leaseTransferTransactions.$inferSelect) {
  if (transaction.agreementStatus !== 'completed' || transaction.propertyApprovalStatus !== 'approved' || transaction.recipientReadinessStatus !== 'ready') {
    throw new Error('Transfer cannot be charged until agreement, property approval, and recipient readiness are complete.');
  }
  if (!transaction.stripeCustomerId || !transaction.stripePaymentMethodId || !transaction.stripeConnectAccountId) {
    throw new Error('Transfer is missing its saved payment method or recipient Stripe account.');
  }
  const chargeCents = transaction.priceCents + transaction.platformFeeCents;
  const intent = await stripePost('/payment_intents', {
    amount: chargeCents, currency: transaction.currency, customer: transaction.stripeCustomerId,
    payment_method: transaction.stripePaymentMethodId, off_session: true, confirm: true,
    application_fee_amount: transaction.platformFeeCents, 'transfer_data[destination]': transaction.stripeConnectAccountId,
    'metadata[lease_transfer_transaction_id]': transaction.id,
  }, `lease-final-charge:${transaction.id}`);
  const requiresAction = intent.status === 'requires_action';
  await db().update(leaseTransferTransactions).set({ stripePaymentIntentId: intent.id, status: requiresAction ? 'awaiting_sca' : 'processing', updatedAt: new Date() }).where(eq(leaseTransferTransactions.id, transaction.id));
  return { paymentIntentId: intent.id, clientSecret: String(intent.client_secret ?? ''), requiresAction };
}

/** Compensating action for a completed destination charge whose handoff failed. */
export async function refundFailedTransfer(transaction: typeof leaseTransferTransactions.$inferSelect) {
  if (!transaction.stripePaymentIntentId) throw new Error('No payment exists to refund.');
  const refund = await stripePost('/refunds', {
    payment_intent: transaction.stripePaymentIntentId, reverse_transfer: true, refund_application_fee: true,
    'metadata[lease_transfer_transaction_id]': transaction.id,
  }, `lease-failure-refund:${transaction.id}`);
  await db().update(leaseTransferTransactions).set({ stripeRefundId: refund.id, status: 'refund_pending', updatedAt: new Date() }).where(eq(leaseTransferTransactions.id, transaction.id));
  return refund.id;
}

export async function recordStripeEvent(event: { id: string; type: string; data: { object?: { metadata?: Record<string, string>; id?: string; payment_method?: string; status?: string; charges_enabled?: boolean; payouts_enabled?: boolean } } }) {
  const transactionId = event.data.object?.metadata?.lease_transfer_transaction_id;
  const inserted = await db().insert(leaseTransferProviderEvents).values({
    transactionId, provider: 'stripe', providerEventId: event.id, eventType: event.type,
    payload: { objectId: event.data.object?.id, status: event.data.object?.status }, receivedAt: new Date(),
  }).onConflictDoNothing().returning({ id: leaseTransferProviderEvents.id });
  if (!inserted[0]) return;
  if (event.type === 'account.updated' && event.data.object?.id) {
    const readinessStatus = event.data.object.charges_enabled && event.data.object.payouts_enabled ? 'ready' : 'restricted';
    await db().update(stripeConnectAccounts).set({ readinessStatus, updatedAt: new Date() }).where(eq(stripeConnectAccounts.stripeAccountId, event.data.object.id));
    await db().update(leaseTransferTransactions).set({ recipientReadinessStatus: readinessStatus, updatedAt: new Date() }).where(eq(leaseTransferTransactions.stripeConnectAccountId, event.data.object.id));
  }
  if (!transactionId) return;
  if (event.type === 'setup_intent.succeeded') {
    await db().update(leaseTransferTransactions).set({ stripePaymentMethodId: event.data.object?.payment_method, status: 'awaiting_agreement', updatedAt: new Date() }).where(eq(leaseTransferTransactions.id, transactionId));
  }
  if (event.type === 'payment_intent.succeeded') {
    await db().update(leaseTransferTransactions).set({ status: 'completed', updatedAt: new Date() }).where(eq(leaseTransferTransactions.id, transactionId));
  }
}
