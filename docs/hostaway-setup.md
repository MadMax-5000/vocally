# Hostaway integration

Anselio replies to Airbnb and Booking.com guest conversations through the
[Hostaway public API](https://api.hostaway.com/documentation). The integration
reuses Anselio's existing sessions, AI pipeline, knowledge retrieval, escalation,
ticketing, and email layers. There is no separate AI engine.

## What it does

1. A Hostaway **unified webhook** delivers `message.received` events.
2. Anselio verifies the webhook's HTTP Basic credentials, resolves the
   conversation, reservation, listing, guest, and booking channel, and ignores
   messages that Anselio sent itself.
3. The guest message is stored in a normal Anselio `Session` (`channel: HOSTAWAY`).
4. `processMessage` runs with the conversation history, Anselio knowledge base,
   reservation details, and cached property details.
5. The reply is sent with `POST /v1/conversations/{id}/messages` and
   `communicationType: "channel"`, so it lands in the original Airbnb or
   Booking.com thread instead of an email.
6. Escalations set the session to `ESCALATED`, create an Anselio ticket when the
   agent's escalation action asks for one, and optionally email the property team.

## Connect an account

1. In Hostaway, open **Settings → Hostaway API**, create an API key, and copy the
   **Account ID** and the API key (the key is shown once).
2. In Anselio, open the agent → **Deploy**, then choose **Airbnb** or **Booking.com**. Both cards use the same Hostaway connection, so connecting either one covers both channels.
3. Enter the Account ID, API key, and optionally a team escalation email.
4. Anselio validates the credentials with the OAuth2 client-credentials flow,
   stores the API key and access token encrypted (`TOKEN_ENCRYPTION_KEY`), and
   registers a unified webhook at:

   `https://<your-app-domain>/api/webhooks/hostaway?connection=<connection-id>`

The webhook is protected with a generated Basic-auth login/password. Hostaway
does not sign webhook payloads; Basic authentication is the supported
verification mechanism.

`NEXT_PUBLIC_APP_URL` must be the public HTTPS origin, otherwise the registered
webhook URL will be wrong.

## Database

Apply the schema with Prisma or the migration file:

```bash
npx prisma db push
# or, on an existing database:
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/005_hostaway_integration.sql
```

The integration adds the `HOSTAWAY` value to `Channel` and `AgentChannelType`,
plus `HostawayConnection`, `HostawayConversation`, and `HostawayMessageDedupe`.

## Safety behavior

- **Duplicate replies:** every Hostaway message key is stored in
  `HostawayMessageDedupe`; webhook retries are acknowledged without re-running
  the AI. A recent identical outgoing reply is also suppressed.
- **Own messages:** messages with `isIncoming = 0` are ignored.
- **Human takeover:** sessions in `HUMAN`, `ESCALATED`, or `CLAIMED` still record
  new guest messages but never auto-reply.
- **Disabled replies:** turning off automatic replies stores guest messages
  without calling the AI.
- **Escalation:** the existing escalation triggers (human request, negative
  sentiment, AI failure, unsupported request) apply. Sensitive or uncertain
  requests receive a handoff message and are escalated in Anselio; the optional
  team email notifies the property team.
- **Property knowledge:** listing description, house rules, check-in/out, key
  pickup, and special instructions are cached and injected into the prompt.
  Door codes and Wi-Fi passwords are deliberately excluded.
- **Channel scope:** only Airbnb (`channelId` 2018) and Booking.com
  (`channelId` 2005) are processed. Direct bookings, Vrbo, and Expedia are ignored.

## Hostaway API limits and external configuration

- **Credentials:** Account ID + client secret are required. Tokens are valid for
  up to 24 months; Hostaway requires waiting at least 1 second after minting
  before use. Anselio caches tokens and refreshes them before expiry.
- **Webhooks:** Hostaway retries failed deliveries up to 3 times within about an
  hour, treats non-2xx as failure, expects acknowledgement within 20 seconds,
  and disables webhooks that fail for 5 consecutive days. The endpoint returns
  5xx on processing failure so Hostaway can retry; dedupe makes retries safe.
- **No event filtering:** unified webhooks deliver reservation events too.
  Anselio filters to `message.received` / `conversationMessage` received events.
- **Rate limit:** `POST /v1/conversations/{id}/messages` allows 30 requests per
  minute per account. Anselio guards this per process and returns 429 to let
  Hostaway retry.
- **No attachments:** the API does not support sending attachments. Only text is
  sent; attachments-only guest messages are ignored.
- **Channel messaging:** Hostaway must have the Airbnb/Booking.com channel
  connected and messaging enabled for the property. The conversation must
  already exist (the guest must have written). Hostaway's docs do not expose a
  way to start a brand-new channel conversation.
- **Property team email:** optional. Without it, escalations remain visible in
  Anselio as `ESCALATED` sessions/tickets.
- **Webhook payload shape:** Hostaway's documented unified webhook log exposes
  `object`, `objectId`, and `event`, but the full delivery body is not fully
  documented. Anselio parses tolerantly and re-fetches the conversation and
  messages from the API before acting, so it never trusts the payload body alone.

## Manual test

1. Connect Hostaway and confirm the webhook appears in Hostaway's unified
   webhook settings.
2. Send a message to the property from Airbnb or Booking.com.
3. Confirm a `HOSTAWAY` session appears in the Anselio inbox and the reply
   arrives inside the same guest thread.
4. Say "I want to speak to a human" and confirm the session is escalated and the
   configured team email receives the escalation.
5. Disable automatic replies and confirm new guest messages are stored without a
   reply.
