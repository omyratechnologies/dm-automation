# ADR 0002: PostgreSQL transactional outbox

Status: Accepted

Lead, appointment and integration state changes append an identifier-only `OutboxEvent` in the same transaction. A polling relay reserves rows with `FOR UPDATE SKIP LOCKED` and publishes deterministic BullMQ jobs. Consumers record `(consumer,eventId)` in `ProcessedEvent`; provider work additionally uses retry-stable operation identities.

This makes Redis loss recoverable without dual writes. At-least-once transport plus database/provider idempotency provides exactly-once-effective mutation.
