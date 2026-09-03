# Gemai enterprise platform charter

Gemai is the system of record for contact identity, leads, pipelines, qualification decisions, appointments and integration state. Google Sheets is a controlled projection and capture surface; Google Calendar is a provider boundary, not the appointment authority.

## Bounded contexts

| Context | Owns | May call |
|---|---|---|
| Lead CRM | contacts, identities, leads, pipelines, stages, attributes, tasks, activities, views, consent | Delivery |
| Automations | flows, immutable versions, runs, qualification policy and decision logs | Lead CRM commands, Delivery |
| Google Integrations | grants, bindings, watches, Calendar, meetings, booking links, Sheets, conflicts | Lead CRM commands, Delivery |
| Messaging | conversations and outbound/inbound messages | Google Integrations commands, Delivery |
| Delivery | outbox, processed events, idempotency, relay, operation attempts | BullMQ and PostgreSQL |

No automation or integration may mutate Lead CRM tables directly. The compatibility `LeadFieldValue` path remains for one release and is tenant-checked.

## Application roles

One NestJS artifact runs as `APP_ROLE=api|worker|relay`. API receives commands and provider webhooks. Worker executes Flow, Calendar and Sheets jobs. Relay polls `OutboxEvent` with `FOR UPDATE SKIP LOCKED`, assigns deterministic job IDs and recovers delivery after Redis loss.

## State and precedence

- Lead mutations require workspace scope and expected version.
- Human and API attributes cannot be overwritten by AI or Sheets. Sheet-confirmed values cannot be overwritten by AI.
- Calendar FreeBusy is a snapshot. PostgreSQL slot exclusion is authoritative before the final provider recheck.
- Sheet deletions mark projections `ROW_MISSING`; they never delete leads.
- Domain events carry identifiers and revisions only.
- `SendMeetingInvitation` is owned by Google Integrations: it validates the workspace conversation, active Lead and eligible Calendar host, then atomically creates the hash-protected booking link, queued Inbox message, audit record and identifier-only `MessageQueued` event. The relay hydrates the provider job from PostgreSQL after commit.

## Capacity assumptions

Design target: 250 seats, 500,000 contacts and 100,000 active leads per workspace. Lists use cursor pagination capped at 100; Sheet destinations cap managed rows at 50,000.
