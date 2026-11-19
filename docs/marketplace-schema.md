# Marketplace schema foundation

The migration pair `20261112_001_marketplace_core.{up,down}.sql` creates an empty additive data model for the future multi-seller marketplace. It does not create users, activate checkout, connect payment providers, store bank credentials, or select a tax/document issuer.

Apply the `up` migration only after reviewing it against a disposable Neon/PostgreSQL database. The matching `down` migration drops the entire marketplace schema and therefore destroys marketplace data; use it only before production data exists or after an independently verified backup and approved data-retention plan. Production rollback should normally disable application routes and preserve purchase/accounting evidence.

Application identity is represented by opaque `owner_user_id` / `actor_user_id` text references because the authentication provider has not been selected. Replace with a foreign key in a later additive migration once that contract exists. The schema stores seller identity details only after the approved onboarding flow defines the required fields.

The checkout snapshots the approved book tax mode, the commercial rate and base, the total commission charged in `commission_minor`, and the VAT included in that charge in `commission_tax_minor`. Historical snapshots are preserved. The operational `platform_commission` ledger account stores the total charged and the matching reversal. `pending_review` blocks publication/checkout until the accountant-approved rules are implemented. Estimates and actual gateway fees are separate fields. The ledger is append-only; reversals must be new balanced entries. The application must enforce one applied payment per order and route additional successful attempts to reconciliation/refund.

The seller, book, revision, asset, order, payment, entitlement, ledger, refund, settlement, outbox, and audit tables intentionally have no RLS/policies yet. Until the authentication and authorization layer is implemented, do not expose them to browser clients or public APIs. Enforce seller ownership and admin actions server-side before any reads or writes. Asset rows store generated private object keys and digests only; an upload/scanning service must enforce quarantine and readiness before publication.

The migration has been checked statically in this PR. No live database credentials are used here. Before production, validate applying and rolling back on an isolated database, then test backup/restore and the application contracts.
