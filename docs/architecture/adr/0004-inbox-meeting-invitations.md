# ADR 0004: Inbox meeting invitations use a transactional booking-link bridge

## Status

Accepted — 2026-09-04.

## Context

An agent needs to send a bookable Google Calendar invitation from an Instagram Inbox conversation. Creating a booking link and immediately adding a Redis job could leave an orphaned link or lose the outbound message when either PostgreSQL or Redis fails.

## Decision

Google Integrations owns `SendMeetingInvitation`. The command validates workspace membership, conversation/contact identity, an active open Lead, an active Meeting Type with an eligible consenting host, and Meta's seven-day human-agent window.

One serializable PostgreSQL transaction creates the hash-protected, fragment-secret Booking Link, queued outbound Message, audit record and identifier-only `MessageQueued` outbox event. After commit, the API attempts a low-latency enqueue with `send-messages:<eventId>`. The relay uses the same deterministic ID and can recover the operation by loading the message and tenant-scoped routing identifiers from PostgreSQL. The existing sender remains the single Meta policy and rate-limit enforcement point.

The public booking page sends the fragment secret only in `Authorization: Booking`; it is never stored in query parameters, logs or an outbox payload.

## Consequences

- Redis loss cannot lose an accepted invitation.
- Replayed delivery is exactly-once effective because the job ID is deterministic and the sender only processes `QUEUED` messages.
- The Inbox UI cannot offer inactive meeting types, cross-contact Leads or hosts without an active Calendar binding.
- A provider rejection remains visible on the outbound message instead of silently deleting the Booking Link.
