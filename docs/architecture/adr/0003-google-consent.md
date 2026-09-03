# ADR 0003: User consent and least-privilege Google access

Status: Accepted

Google grants belong to an application user and immutable Google OIDC `sub`. Workspace bindings delegate capabilities without transferring consent. Rep calendars require member-owned bindings; Sheets and shared calendars require admin-authorized workspace bindings.

OAuth uses PKCE, single-use state, offline access and incremental scopes. Sheets uses `drive.file` selected resources. Domain-wide delegation and service accounts are excluded.
