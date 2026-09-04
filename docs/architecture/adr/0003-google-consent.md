# ADR 0003: User consent and least-privilege Google access

Status: Accepted

Google grants belong to an application user and immutable Google OIDC `sub`. Workspace bindings delegate capabilities without transferring consent. Rep calendars require member-owned bindings; Sheets and shared calendars require admin-authorized workspace bindings.

OAuth uses PKCE, single-use state, offline access and incremental scopes. Sheets uses `drive.file` selected resources. Domain-wide delegation and service accounts are excluded.

One organization-managed production OAuth client identifies Gemai; customers do not provide client secrets. Each customer selects and consents with their own Google account. Every active member may create or disconnect only their own member-owned Calendar binding. Only Owners and Admins may create or disconnect workspace-owned Sheets or shared Calendar bindings.

The public callback never returns tokens or provider payloads to the browser. It redirects to the configured `WEB_ORIGIN` using a server-stored, same-origin dashboard path and a non-sensitive success, cancellation or stable error code. Grant/binding mutations and their audit record commit in one PostgreSQL transaction.
