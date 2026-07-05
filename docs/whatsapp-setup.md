# WhatsApp Setup Guide

## Overview

Anselio connects customer WhatsApp Business numbers via **Twilio ISV + Meta Embedded Signup**. Customers enter their number in the dashboard, verify with Meta in-app, and Anselio automatically:

- Creates a Twilio subaccount per organization
- Registers the WhatsApp sender via the Twilio Senders API
- Configures inbound webhooks to `/api/webhooks/twilio/message`
- Routes messages to the correct agent and AI pipeline

---

## For customers (dashboard)

1. Open **Dashboard → Agents → [agent] → Deploy → WhatsApp**
2. Enable the WhatsApp toggle
3. On **Connect**, enter your WhatsApp Business phone number (E.164, e.g. `+212612345678`)
4. Click **Connect with WhatsApp** and complete the Meta verification popup
5. Wait until status shows **Online**
6. On **Test**, send a message from your phone to confirm auto-replies
7. On **Settings**, customize welcome message, away message, business hours, and profile text

No Twilio Console access is required for customers.

---

## For Anselio operators (one-time platform setup)

Before customers can connect production numbers:

### 1. Twilio parent account

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

### 2. Meta Tech Provider program

Follow [Twilio WhatsApp Tech Provider integration guide](https://www.twilio.com/docs/whatsapp/isv/tech-provider-program/integration-guide):

1. Create a Meta Business app
2. Complete Tech Provider onboarding + App Review (`whatsapp_business_messaging`, `whatsapp_business_management`)
3. Open a Twilio support ticket to link your Meta app to the **Twilio Partner Solution**
4. Copy the **Configuration ID** and **Partner Solution ID**

### 3. Environment variables

```bash
# Twilio ISV parent account
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Meta Embedded Signup (client + server)
NEXT_PUBLIC_META_APP_ID=
NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID=
NEXT_PUBLIC_META_PARTNER_SOLUTION_ID=
META_APP_SECRET=

# Public app URL (webhooks + OAuth)
NEXT_PUBLIC_APP_URL=https://anselio.com

# Optional: dev sandbox without Meta signup
# WHATSAPP_SANDBOX_MODE=true
# TWILIO_WHATSAPP_NUMBER=+14155238886
```

### 4. Database

```bash
npx prisma db push
npx prisma generate
```

---

## Architecture

### Multi-tenancy

- One **Twilio subaccount** per customer organization (`Organization.twilioSubaccountSid`)
- One **WABA** maps to one subaccount
- `WhatsappPhoneNumber.twilioNumber` routes inbound webhooks to org + agent
- Webhook signature validation uses the subaccount auth token (falls back to parent for legacy rows)

### Connection statuses

| Status | Meaning |
|---|---|
| `PENDING` | Legacy manual mapping (reconnect recommended) |
| `CREATING` | Sender registration in progress |
| `VERIFYING_OTP` | Meta OTP required for non-Twilio numbers |
| `ONLINE` | Ready to send/receive |
| `FAILED` | Registration error (see `statusMessage`) |

### Message flow

```
Customer WhatsApp → Twilio → POST /api/webhooks/twilio/message
  → Validate signature (subaccount token)
  → Lookup WhatsappPhoneNumber by To
  → Find/create Session (channel=WHATSAPP)
  → Apply business hours / welcome message settings
  → processMessage() (RAG + LLM)
  → sendWhatsAppMessage() via subaccount credentials
```

### Idempotency

Inbound messages are deduplicated by `MessageSid` in `WhatsappMessageDedupe`.

---

## Local development

### Sandbox mode (no Meta app)

```bash
WHATSAPP_SANDBOX_MODE=true
TWILIO_WHATSAPP_NUMBER=+14155238886
```

Join the Twilio WhatsApp sandbox from your phone, then connect in the dashboard. Anselio maps your agent to the sandbox number.

### Production Embedded Signup locally

Meta requires HTTPS for the JavaScript SDK. Use ngrok:

```bash
ngrok http 3000
# Set NEXT_PUBLIC_APP_URL to the ngrok HTTPS URL
# Add the domain to Meta App → Facebook Login for Business → Allowed Domains
```

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Connect button disabled | Missing `NEXT_PUBLIC_META_*` env vars or Twilio credentials |
| Stuck on CREATING | Twilio sender registration async — wait or check Twilio Console Senders |
| OTP required | Non-Twilio number — enter Meta SMS code on Connect tab |
| Webhook 403 | Wrong auth token — subaccount token must match `AccountSid` in webhook body |
| Legacy connection banner | Reconnect via new flow to enable automatic webhook setup |
| No AI reply | Agent not Public/Active, or connection not ONLINE |

---

## API routes (internal)

| Route | Purpose |
|---|---|
| `POST /api/integrations/whatsapp/complete` | Register sender after Embedded Signup |
| `PUT /api/integrations/whatsapp/complete` | Submit OTP verification |
| `GET /api/integrations/whatsapp/status` | Poll connection status |
| `POST /api/webhooks/twilio/message` | Inbound WhatsApp (and SMS) webhook |
