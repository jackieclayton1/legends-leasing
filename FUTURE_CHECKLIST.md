# Future verification workflow checklist

The v1 AI assistant never publishes a listing or makes a verification decision. Before enabling a durable verification workflow, complete these decisions and controls:

- [ ] Select a durable workflow runner that supports retries, idempotency, delayed steps, and observable human-review wait states.
- [ ] Build an internal reviewer queue with roles, assignment, SLAs, escalation, and immutable decision/audit views.
- [ ] Define approved address and ownership evidence sources; never treat an AI inference as ownership proof.
- [ ] Integrate roommate outreach only after consent language, an email provider, delivery handling, and opt-out rules are approved.
- [ ] Define consent collection, revocation, retention, and evidence-access controls for every occupant.
- [ ] Establish market-price sources and a reviewer policy for price anomalies; expose a risk flag, not an automatic rejection.
- [ ] Define virtual-tour upload, malware scanning, retention, reviewer rubric, and manual inspection procedures.
- [ ] Define accessibility evidence and review standards with disability-services/legal input; never infer accessibility from photos alone.
- [ ] Add secure direct-to-object-storage uploads, signed access, redaction, retention/deletion jobs, and incident procedures.
- [ ] Add notification preferences and delivery tracking for applicant, roommate, and reviewer updates.
- [ ] Add workflow evaluations, trace review, fraud-abuse handling, legal/privacy review, and a manual-review rollout before any automated action.

## Durable Workflow SDK and Lease Payments

This application has the payment-domain schema and secure API boundaries, but it is **not authorized to process live lease-transfer payments**. The current Expo Router server adapter does not yet have a supported Workflow SDK compiler integration. Do not add uncompiled `"use workflow"` functions to this application; establish a supported Vercel Workflow SDK server workstream first.

### Workflow SDK workstream

- [ ] Add a supported Workflow SDK host (for example, a Nitro/Vite service) and configure its compiler plugin, route handler, TypeScript plugin, Vercel project, and Fluid compute before importing `workflow` into production code.
- [ ] Keep every `"use workflow"` function orchestration-only. Put Stripe, DocuSign, Resend, Neon, cryptography, and Node-dependent operations in `"use step"` functions.
- [ ] Define deterministic hook tokens and idempotency keys from the transaction UUID; verify all external webhooks before resuming a run.
- [ ] Use replay-safe, tenant-scoped database writes and append-only provider event records. Do not put payment secrets, OTPs, signed agreement contents, credit information, or document contents in workflow input/output/logs.
- [ ] Implement the durable lease-payment run: snapshot price and 5% fee; wait for SetupIntent consent; wait for counsel-approved DocuSign completion; send/verify property approval OTP; wait for all approvals and Connect readiness; create the final off-session destination PaymentIntent; pause for SCA for up to 48 hours; record completion and send receipts.
- [ ] Define timeout, retry, cancellation, and compensation behavior. Before agreement/approval completion, cancellation ends with no charge. After a successful charge with failed handoff, fully refund with `reverse_transfer` and `refund_application_fee`; post-agreement cancellation requires support review and contract terms, defaulting to a full refund.
- [ ] Run local observability and inspect runs before launch (`workflow web`, `workflow inspect runs`, run deep links); establish production run lifecycle, alerting, retention, and support ownership conventions.
- [ ] Add workflow integration tests for replay, restart, duplicate hook/webhook delivery, timeouts, SCA recovery, cancellation, and compensation.

### Stripe payments and Connect

- [ ] Store `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` only in server/Vercel environment configuration. Set `STRIPE_ENVIRONMENT` to match test or live keys; never expose secret keys in Expo public variables.
- [ ] Configure the Stripe React Native config plugin and create an EAS development build for payment testing. Test iOS and Android PaymentSheet, return URLs, redirect handling, Apple Pay/Google Pay if enabled, and SCA recovery.
- [ ] Configure browser Payment Element with a public test/live key and test it separately from the native PaymentSheet.
- [ ] Verify the existing SetupIntent flow saves a reusable method with clear deferred-charge consent and never charges while agreement, property approval, or recipient readiness is incomplete.
- [ ] Complete Connect Express account onboarding with secure browser redirects and verify account capabilities/readiness through signed Stripe events. Evaluate embedded Connect management only for web.
- [ ] Have the workflow call the final destination-charge function only after all prerequisites. Charge transfer price plus the frozen 5% fee, send the price to the recipient, and keep the fee as the application fee.
- [ ] Expand verified Stripe webhook handling for PaymentIntent SCA/failure, refund, transfer/reversal, account capability, and dispute events. Preserve redacted, append-only provider-event audit records and reject duplicates.
- [ ] Test duplicate client actions, duplicate Stripe events, Stripe test clocks, failed handoff refunds, transfer reversal, application-fee refund, and support-approved contract refunds.

### Agreements, property approval, and messaging

- [ ] Configure DocuSign production credentials, a counsel-approved and versioned agreement template, recipient roles, envelope creation, and signed completion webhook verification. Store only envelope identifiers and status, never agreement contents.
- [ ] Configure Resend with a verified sender domain, delivery event webhooks, bounce handling, approval-link delivery, reminders, and opt-out policy.
- [ ] Create approval links bound to one transaction and approver; generate a short-lived OTP hash server-side, reject expired/wrong/forwarded links, and record only `approved`, `rejected`, or `needs_more_info`.
- [ ] Property managers conduct screening independently. Do not collect, receive, process, or retain credit reports or credit decision rationale.

### Legal, privacy, and launch gates

- [ ] Obtain multi-state legal review for lease-transfer terms, deferred-charge disclosure, cancellation/refund terms, dispute handling, and fee presentation. Never describe the product as escrow or imply it holds customer funds.
- [ ] Publish retention, deletion, access-control, incident-response, and support procedures for transaction metadata and provider references.
- [ ] Confirm tenant isolation and eligibility enforcement across every payment, agreement, approval, support, and webhook path.
- [ ] Block live launch until live Stripe keys, production DocuSign credentials, a verified Resend sender domain, Connect capability review, legal approval, a staffed support playbook, and end-to-end test evidence are complete.
