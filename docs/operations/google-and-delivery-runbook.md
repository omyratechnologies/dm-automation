# Google and delivery runbook

## First response

1. Confirm core readiness. Google degradation must not fail `/health/ready` for lead capture or Instagram messaging.
2. Inspect outbox lag, failed `IntegrationOperation` rows, BullMQ failed jobs and binding/watch status by workspace.
3. Stop replay if duplicate provider mutation is suspected; deterministic Calendar IDs and Sheet lead IDs must be reconciled before retry.

## Google 401/403

- 401 or `invalid_grant`: set grant and bindings to `REAUTH_REQUIRED`; do not delete credentials until the user reconnects or revokes all access.
- 403: compare granted scopes and resource ACL. Never expand scope silently.
- Member removal: disable routing immediately. Workspace-owned resources become `TRANSFER_REQUIRED` until an Admin reconnects.

## Google 429/5xx

Honor provider retry guidance with jittered exponential backoff. Open a per-workspace/provider circuit after sustained failure so a large tenant cannot starve other workspaces. Keep operations actionable and retain the stable error code.

## Watches and synchronization

- Renew channels 24–30 hours before expiry.
- Notifications are wake-up signals only; drain Calendar sync tokens or the Drive changes feed.
- Calendar `410` requires full resync and a new sync token.
- Reconciliation runs every 15 minutes. Missed notifications must converge through reconciliation.

## Sheet drift and conflicts

Pause the destination as `MISCONFIGURED` on header drift. Public sharing blocks activation. Stale versions, invalid fields, identity collisions and concurrent edits create `SheetSyncConflict`; never last-write-wins. Deleted rows become `ROW_MISSING`.

## Redis loss and DLQ replay

Restore Redis, start the relay, and observe outbox lag return below five seconds. Deterministic job IDs and `ProcessedEvent` prevent repeated effective mutations. Replay DLQ jobs in bounded workspace batches and verify `IntegrationOperation` reconciliation.

For Inbox meeting invitations, query `MessageQueued` outbox rows and their referenced `Message`. A `PENDING` event with a `QUEUED` message is safe to replay: the relay uses `send-messages:<eventId>` and the sender exits when the message is no longer queued. Never place the booking secret or message text into an outbox payload. If the message is permanently rejected, preserve the booking link for auditability and let the agent send a fresh invitation only while the Meta human-agent window remains valid.

## Backup and rollback

Before migration: take and verify a PostgreSQL backup, run migration preflight and record counts per workspace. Target RPO is 15 minutes and RTO is four hours. A staging restore drill is mandatory before enterprise launch. Roll back application feature flags first; do not contract legacy tables during the compatibility release.
