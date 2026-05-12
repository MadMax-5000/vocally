# WhatsApp Setup Guide

## Overview

This document covers the end-to-end setup of WhatsApp messaging via Twilio for the Vocally platform.

The architecture maps incoming WhatsApp messages to specific organizations (multi-tenant) via the `WhatsappPhoneNumber` model, then processes them through the shared AI pipeline.

---

## Prerequisites

- A Twilio account ([sign up](https://www.twilio.com/try-twilio))
- A WhatsApp Business Account (WABA) — or use the Twilio WhatsApp Sandbox for development
- Verified domain for webhook URLs (ngrok for local dev)

---

## 1. Twilio Account Setup

1. Log in to the [Twilio Console](https://console.twilio.com)
2. Note your **Account SID** and **Auth Token** from the dashboard
3. Buy a phone number capable of SMS (console → Phone Numbers → Buy a Number)

---

## 2. WhatsApp Sandbox Setup (Development)

The Sandbox lets you test WhatsApp messaging without a production WhatsApp Business Account.

1. In Twilio Console, go to **Messaging → Try it out → Send a WhatsApp message**
2. You'll see a Sandbox number (e.g., `+14155238886`)
3. Note the **Sandbox join code** (e.g., `join some-word`)
4. From your WhatsApp app, send the join code to the Sandbox number
5. You're now connected to the Sandbox

---

## 3. Webhook Configuration

### Configure Messaging Webhook

1. In Twilio Console, go to **Messaging → Settings → WhatsApp Sandbox Settings**
2. Set **WHEN A MESSAGE COMES IN** to your webhook URL:
   - Production: `https://vocally.app/api/webhooks/twilio/message`
   - Development: `https://your-ngrok.ngrok.io/api/webhooks/twilio/message`
3. Set the HTTP method to **POST**
4. Leave **Status callback URL** empty unless you want delivery receipts

### Production WhatsApp Sender

When using a production WhatsApp Business number:
1. Go to **Messaging → Senders → WhatsApp Senders**
2. Click your sender number
3. Under **Webhook URL**, set the same `/api/webhooks/twilio/message` URL

---

## 4. Environment Variables

Add these to your `.env` file:

```bash
# Required
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886
```

- `TWILIO_WHATSAPP_NUMBER`: The Twilio WhatsApp number (with or without `whatsapp:` prefix — the code handles both)
- For Sandbox: use the Sandbox number from the console

---

## 5. Database Setup

The `WhatsappPhoneNumber` model maps a Twilio number to an organization and (optionally) a specific agent.

Apply the schema:

```bash
npx prisma db push
```

Then register your WhatsApp number for an organization. You can do this via the Prisma Studio or a SQL insert:

```sql
INSERT INTO "WhatsappPhoneNumber" ("id", "orgId", "agentId", "twilioNumber", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  '<org-prisma-id>',
  NULL,  -- or an agent ID to route to a specific agent
  'whatsapp:+14155238886',
  true,
  NOW(),
  NOW()
);
```

Or using Prisma Studio:

```bash
npx prisma studio
```

Then add a record to the `WhatsappPhoneNumber` table.

### Agent Configuration

Each agent must have the `WHATSAPP` channel enabled in their `AgentChannel` configuration. This is configured via the dashboard agent settings UI. If no agent is specified in `WhatsappPhoneNumber`, the system will use the first active agent with WhatsApp channel enabled in the organization.

---

## 6. Local Development with ngrok

Since Twilio needs a public HTTPS URL to send webhooks, use ngrok for local development:

```bash
# Install ngrok (one time)
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Set it as the webhook URL in Twilio Console
# Update your .env if needed
```

Then run your dev server:

```bash
npm run dev
```

---

## 7. Testing the Integration

### Send a WhatsApp Message

1. From your WhatsApp app, send a message to the Sandbox number
2. The webhook will hit `POST /api/webhooks/twilio/message`
3. The system will:
   - Validate the Twilio signature
   - Resolve the organization from the `To` number
   - Find or create a session
   - Save your message
   - Run the AI pipeline (RAG → LLM)
   - Save the AI response
   - Reply back via WhatsApp

### Verify in Database

```bash
npx prisma studio
```

Check:
- `Session` table: new session with `channel: WHATSAPP` and your customerId
- `Message` table: both USER and BOT messages linked to the session
- `WhatsappPhoneNumber` table: your number mapping

---

## 8. Production Number Migration

To migrate from Sandbox to a production WhatsApp Business number:

1. Register a WhatsApp Business Account (WABA) via Twilio Console
2. Submit a WhatsApp Business profile (display name, description, website)
3. Complete business verification
4. Submit message templates for approval (required for business-initiated messages)
5. Once approved, request the production number migration
6. Update `TWILIO_WHATSAPP_NUMBER` in your environment
7. Update the `twilioNumber` in `WhatsappPhoneNumber` table
8. Update the webhook URL in Twilio Console to point to the production sender

---

## 9. Architecture Notes

### Multi-Tenancy

Each Twilio WhatsApp number maps to exactly one organization via `WhatsappPhoneNumber.twilioNumber`. This allows:

- Multiple WhatsApp numbers per organization
- One-to-one mapping between number and tenant
- Future: multiple numbers routed to different agents in the same org

### Session Persistence

- Each customer (identified by their WhatsApp number) gets one active session per organization
- Active sessions are those with status `ACTIVE`, `WAITING`, or `BOT`
- Resolved or abandoned sessions can be followed up with a new session
- Full message history is preserved

### AI Pipeline

The WhatsApp flow reuses the same AI pipeline as the web chat:
1. **RAG**: Message is embedded → pgvector similarity search → relevant knowledge chunks
2. **Context**: Knowledge chunks + recent history → system prompt
3. **LLM**: OpenRouter chat completions → AI response
4. **Response**: Saved as BOT message & sent via Twilio API

### Rate Limiting

- Twilio WhatsApp API: 80 messages/second per sender (text)
- The `processMessage` function handles LLM errors gracefully with a fallback message
- No additional rate limiting is applied at the webhook level (Twilio handles queuing)

### Idempotency

Webhook processing is NOT idempotent by `MessageSid` in this version. For production with high-volume traffic, add an idempotency check:

```typescript
const exists = await prisma.message.findFirst({
  where: { sessionId, content: `[webhook:${MessageSid}]` },
});
if (exists) return;
```

---

## 10. Message Flow (End-to-End)

```
Customer WhatsApp → Twilio → POST /api/webhooks/twilio/message
                                         │
                                    Validate signature
                                         │
                                    Parse body (From, To, Body, MessageSid)
                                         │
                                    Lookup WhatsappPhoneNumber by To
                                         │
                               ┌─── Org found? ───┐
                               │                   │
                               │                   No → Return empty TwiML
                               │                         (ignore orphan messages)
                               │
                          Find/Create Session
                         (by customerId + orgId)
                               │
                          Save USER message
                               │
                          Fetch agent (from mapping or first
                          active with WhatsApp channel)
                               │
                          ┌──── Agent found? ────┐
                          │                      │
                          │                      No → Reply: "No agent configured"
                          │
                          processMessage()
                          │  → generateEmbedding()
                          │  → similaritySearch() (RAG)
                          │  → build prompt + history
                          │  → callLLM()
                          │
                          Save BOT message
                               │
                          sendWhatsAppMessage()
                               │
                         Response: <Response></Response>
```

---

## Troubleshooting

| Symptom | Likely Cause |
|---|---|
| Webhook returns 403 | Twilio signature validation failed — check `TWILIO_AUTH_TOKEN` |
| "No agent configured" message | No `WhatsappPhoneNumber` record, or no agent with WhatsApp channel enabled |
| AI response not sending | Check `OPENROUTER_API_KEY` and LLM model configuration |
| Duplicate responses | Webhook retry — consider idempotency by `MessageSid` |
| Media messages ignored | Media not supported yet — system responds with text-only message |
| ngrok URL not working | Update webhook URL in Twilio Console; restart ngrok if URL changed |
