# Meta App Review submission package

Prepared: 18 August 2026

App: Gemai (`1691842375264188`)

Production URL: <https://gemai.omyratech.com>

## Current review scope

Request only the permissions and features exercised by the production product:

1. `instagram_business_basic`
2. `instagram_business_manage_messages`
3. `instagram_business_manage_comments`
4. Human Agent
5. Business Asset User Profile Access

Do not request `instagram_business_content_publish` or
`instagram_business_manage_insights`. Gemai does not publish Instagram content
or read Instagram Insights.

All five items are in the current App Review draft. The irreversible Tech
Provider designation has been completed and the business is verified. Access
Verification has been prepared as a draft but has not been submitted; Meta
currently shows a deadline of 17 October 2026.

## Permission explanations

### `instagram_business_basic`

Gemai uses this permission when a customer connects an Instagram professional
account. It reads the connected account's ID, username, account type and media
list. The media list lets the customer select a specific Instagram post when
configuring comment-triggered automation. Gemai does not create, edit or delete
Instagram posts.

### `instagram_business_manage_messages`

Gemai receives Instagram messaging webhook events, stores the conversation in a
shared inbox and sends replies selected by the connected business. The events
include direct messages, story replies and story reactions. Automated replies
are sent only in Meta's standard messaging window. Messages outside that window
are rejected unless an authorized staff member sends a qualifying Human Agent
reply.

### `instagram_business_manage_comments`

Gemai receives comment webhook events on the connected professional account.
Customers can configure keyword-triggered flows and send a private reply tied
to the triggering comment. A comment permits only that single private reply; it
does not open the standard 24-hour messaging window, and the automation waits
for an inbound direct response before any ordinary follow-up DM. Gemai does not
use this permission for unrelated public-content discovery or moderation of
accounts the customer does not own.

### Human Agent

Human Agent is used only by an authenticated team member typing a manual reply
in Gemai's shared Inbox. The API adds the `HUMAN_AGENT` tag only for messages
whose source is `AGENT`, only after the normal 24-hour window, and only within
seven days of the user's message. Automated flows and broadcasts are never sent
with this tag. The server rejects manual replies after the seven-day window.

### Business Asset User Profile Access

Gemai reads the profile fields Meta makes available for a person who has
engaged with the connected Instagram business: identifier, name, username,
profile picture and follow-status fields. These fields let the business
recognize the contact in its Inbox and apply a customer-configured follow gate.
Gemai does not use these fields for advertising, identity enrichment, sale or
cross-business profiling.

## Reviewer instructions

Replace every bracketed value before entering this text in Meta.

1. Open <https://gemai.omyratech.com/sign-in> and sign in with the reviewer
   account: `[REVIEWER_EMAIL]` / `[REVIEWER_PASSWORD]`.
2. In the dashboard, open **Connections** and select **Connect Instagram**.
3. In Meta's Instagram authorization screen, continue with the supplied
   Instagram professional test account: `[INSTAGRAM_TEST_USERNAME]` /
   `[INSTAGRAM_TEST_PASSWORD]`, and approve the requested permissions.
4. Return to Gemai and confirm that the connected Instagram username and media
   are visible.
5. Open **Flows**, create or use `[FLOW_NAME]`, choose `[TEST_POST]`, and enable
   the comment keyword `[KEYWORD]`.
6. From `[SECOND_INSTAGRAM_ACCOUNT]`, comment `[KEYWORD]` on `[TEST_POST]`. The
   comment event should create/update the contact and send the configured
   private reply. Open **Inbox** to see the conversation and the contact's
   available profile fields.
7. From `[SECOND_INSTAGRAM_ACCOUNT]`, send a direct message to the connected
   professional account. Confirm the inbound message appears in **Inbox** and
   the configured automated response is delivered.
8. For Human Agent review, use the prepared conversation whose last inbound
   message is more than 24 hours but less than seven days old. Type a manual
   response in **Inbox**. The response is sent by a human team member with the
   Human Agent tag. The same path rejects a conversation older than seven days.

Reviewer support contact: `support@gemai.in`

## Screencast shot list

Record one continuous, readable video:

1. Start signed out and show the production domain.
2. Sign in with the reviewer account.
3. Open Connections and complete Instagram Business Login, including Meta's
   permission screen.
4. Show the connected username and media selector.
5. Configure a post/comment keyword flow.
6. Trigger the flow with a comment and show the private reply plus Inbox entry.
7. Send a direct message and show the webhook-driven Inbox update and reply.
8. Open the contact panel and show only the profile fields used by Gemai.
9. Demonstrate a manual Human Agent reply using a conversation between 24
   hours and seven days old.
10. Show the public privacy policy and account-deletion page.

Do not expose production tokens, API secrets, browser developer tools,
unrelated customer conversations or real customer profile data in the video.

## Public and callback URLs

- Privacy policy: <https://gemai.omyratech.com/privacy-policy>
- Terms: <https://gemai.omyratech.com/terms>
- Account/data deletion instructions:
  <https://gemai.omyratech.com/account-deletion>
- OAuth redirect:
  <https://gemai.omyratech.com/callback/instagram>
- Webhook callback:
  `https://[PRODUCTION_API_HOST]/v1/webhooks/instagram`
- Meta deauthorization callback:
  `https://[PRODUCTION_API_HOST]/v1/webhooks/meta/deauthorize`
- Meta data-deletion callback:
  `https://[PRODUCTION_API_HOST]/v1/webhooks/meta/data-deletion`

Confirm the production API host before submitting. Do not point callback URLs
at a preview deployment.

## Data-handling summary

- **Data received:** connected professional-account profile and media metadata;
  messages, comments, story replies/reactions and their sender identifiers;
  available engaging-user profile fields; OAuth access tokens.
- **Purpose:** account connection, customer-configured automation, shared inbox,
  contact recognition, support and security.
- **Storage:** relational database for business data; Redis for queues, rate
  limits and bounded cache data.
- **Token protection:** access tokens are envelope-encrypted and sent to Meta in
  the `Authorization` header, never in request URLs.
- **OAuth protection:** the server creates a random, short-lived state value in
  an HttpOnly cookie and validates it before exchanging an authorization code.
- **Webhook protection:** HTTPS callback, Meta signature verification, event
  deduplication and automatic deletion of raw webhook records after 30 days.
- **Deletion:** signed deauthorization and deletion callbacks purge the
  connected Instagram account, encrypted token, derived contacts,
  conversations, messages and stored webhook payloads. The deletion status
  record retains a random confirmation code but not the Meta user ID.
- **Service providers:** list the actual production hosting, database, Redis,
  authentication, logging/monitoring and AI providers in Meta's data-handling
  form. Confirm current vendors and regions from production configuration; do
  not copy development-only services into the answer.
- **Sale/advertising:** Instagram data is not sold and is not used for
  advertising or unrelated profiling.

## Pre-submission gate

- [x] Irreversible Tech Provider designation completed by the business owner.
- [x] Business verification is complete.
- [ ] Access Verification draft is reviewed and submitted if required.
- [ ] The changes in this branch are deployed to the production web and API.
- [ ] The three public legal/deletion URLs return HTTP 200 and show the updated
      Gemai-specific content.
- [ ] Production webhook, deauthorization and data-deletion callback URLs are
      configured and tested with valid Meta signatures.
- [ ] Reviewer Gemai and Instagram test credentials are created and tested in a
      clean browser session.
- [ ] A test conversation between 24 hours and seven days old is prepared for
      the Human Agent demonstration.
- [ ] At least one successful test call is visible in Meta for every requested
      permission/feature. At the time of this audit only
      `instagram_business_basic` showed a call; the others showed zero.
- [ ] The screencast is uploaded and every requested item is visibly exercised.
- [ ] Allowed-usage and data-handling answers have been reviewed by the business
      owner and match actual production vendors and practices.
- [ ] Reviewer instructions contain no placeholders.
- [ ] The final request scope contains exactly the five items listed above.
- [ ] The business owner reviews Meta's certifications and performs or confirms
      the final submission.
