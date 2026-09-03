# Privacy and SOC 2 control notes

- Workspace scope is mandatory on tenant resources; composite tenant foreign keys prevent cross-workspace relations.
- Unsafe canonical commands use `Idempotency-Key`; versioned mutations use `If-Match`.
- Audit writes are awaited and Lead CRM commands write audit plus outbox records transactionally.
- OAuth refresh tokens use versioned envelope encryption. Access tokens exist only in memory. Production injects `TOKEN_MASTER_KEYS` from a managed secret manager, rotates with `TOKEN_MASTER_KEY_VERSION`, retains retired versions only for recovery, and must exercise old/new-key restoration before launch. A native cloud-KMS adapter remains an optional deployment hardening step.
- Sensitive lead fields default to denied Sheet export. Admin approval and non-public file ACL are both required.
- Calendar descriptions contain only a lead UUID; transcripts and custom fields are forbidden.
- Workspace export/erasure disclosures must identify residual Google version history, forwarded invitations and backup retention.
- HTTP uses HSTS, CSP, secure Clerk cookies and an allowlisted credentialed CORS policy. CI blocks known high-severity dependency issues, runs secret scanning and publishes an SPDX SBOM into the release evidence.

Retention defaults to be approved by the privacy owner before production: archived leads, decisions, audit logs, integration operations and conflicts require independently configurable policies. Legal hold, data residency, custom roles, SSO/SCIM and customer-managed keys remain roadmap items.
