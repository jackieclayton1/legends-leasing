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
