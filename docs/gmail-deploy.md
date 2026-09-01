# Gmail agent deployment

Per-agent Gmail OAuth for inbound AI email (Pub/Sub push) and outbound replies via the Gmail API.

## Google Cloud setup

1. Create a GCP project and enable **Gmail API** and **Cloud Pub/Sub API**.
2. **OAuth consent screen** (External for public SaaS):
   - Scope: `https://www.googleapis.com/auth/gmail.modify`
   - Add test users while in Testing mode.
3. **OAuth client** (Web application):
   - Authorized redirect URI: `https://<your-domain>/api/oauth/google/callback`
   - Authorized JavaScript origins: your app URL (and `http://localhost:3000` for dev).
4. **Pub/Sub topic**: `projects/<project-id>/topics/gmail-agent-inbound`
5. Grant **Publish** on the topic to `gmail-api-push@system.gserviceaccount.com`.
6. **Push subscription** → HTTP endpoint: `https://<your-domain>/api/webhooks/gmail/push`

## Environment variables

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Optional; defaults to NEXT_PUBLIC_APP_URL or VERCEL_URL + /api/oauth/google/callback
GOOGLE_OAUTH_REDIRECT_URI=
GOOGLE_PUBSUB_TOPIC=projects/<project-id>/topics/gmail-agent-inbound
# At least 16 characters; used to encrypt OAuth refresh tokens at rest
TOKEN_ENCRYPTION_KEY=
# Protects POST /api/cron/gmail-renew-watch
CRON_SECRET=
```

`NEXT_PUBLIC_APP_URL` should be your public app origin (e.g. `https://anselio.com`). Never set it to `http://localhost:3000` in Vercel Production — that value is baked into the client bundle at build time.

## Renewing mailbox watch

Gmail `users.watch` expires after ~7 days. A daily cron hits `/api/cron/gmail-renew-watch` with header `Authorization: Bearer <CRON_SECRET>`.

On Vercel, add to `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/gmail-renew-watch", "schedule": "0 6 * * *" }]
}
```

## Production OAuth verification

Sensitive Gmail scopes require Google verification before non–test users can connect. Until then, only accounts listed as **Test users** on the consent screen can authorize.

## Resend inbound (unchanged)

Org-level custom addresses via Resend (`EmailAddress` + `/api/webhooks/email/inbound`) remain separate from per-agent Gmail connections.
