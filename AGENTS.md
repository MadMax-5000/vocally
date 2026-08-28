# AGENTS.md — AI Contact Call SaaS (CCaaS)

> This file is the **single source of truth** for any AI agent (Cursor, Copilot, Claude, Codex, etc.)
> working on this codebase. Read it fully before writing a single line of code.

---

## 1. Project Overview

This is a **cloud-native, AI-first Contact Center as a Service (CCaaS)** platform targeting the
Moroccan market — with full support for Arabic (MSA + Darija dialect), French, and English.

The platform combines omnichannel AI agents (voice, chat, SMS, WhatsApp, email), live agent
dashboards with real-time AI co-pilot assistance, automated post-call workflows, quality analytics,
and CRM integrations — all delivered as a multi-tenant SaaS product.

**Tagline**: Replace rigid IVR menus with conversational AI that actually resolves issues.

---

## 2. Tech Stack (Canonical — Do Not Deviate)

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, React 18, TypeScript) |
| Styling | Tailwind CSS v3 — follow `DESIGN.md` always |
| Auth | Clerk (multi-tenant, org management) |
| Database | Supabase (Postgres + Realtime + Storage) |
| ORM | Prisma (schema-first, Supabase connection string) |
| Vector DB | Pinecone (knowledge base / FAQ embeddings) |
| Telephony | Twilio (Voice, SMS, WhatsApp, Media Streams) |
| AI (LLM, Embeddings) | OpenRouter (single API key, 300+ models: OpenAI, Anthropic, Google, etc.) |
| Email | Resend (transactional emails, agent notifications) |
| Payments | LemonSqueezy (subscription billing, webhooks) |
| Analytics | Google Analytics 4 + custom event tracking |


---

## 3. ⚠️ DESIGN RULE — NON-NEGOTIABLE

> **Always read and follow `DESIGN.md` in the root folder before creating or modifying ANY UI.**

- The design system is **inspired by ElevenLabs** — minimal, refined,  sophisticated.
- Never introduce new colors, fonts, spacing scales, or component patterns that aren't defined in `DESIGN.md`.
- Every new page, component, modal, form, table, or chart must use the tokens and conventions from `DESIGN.md`.
- When in doubt: check `DESIGN.md` first, then implement.
- Do not use generic AI aesthetics: no purple gradients on white, no Inter/Roboto/Arial, no cookie-cutter layouts.
- Light theme is the default and only theme. Follow the DESIGN.md off-white canvas and warm ink patterns. Respect contrast ratios for accessibility (WCAG AA minimum).

## 5. Database Schema (Prisma + Supabase)

Core models the agent must be aware of. Extend as needed but never remove required fields.

```prisma
model Organization {
  id          String   @id @default(cuid())
  clerkOrgId  String   @unique
  name        String
  plan        Plan     @default(FREE)
  createdAt   DateTime @default(now())
  calls       Call[]
  sessions    Session[]
  agents      Agent[]
  knowledgeDocs KnowledgeDoc[]
}

model Agent {
  id           String   @id @default(cuid())
  clerkUserId  String   @unique
  orgId        String
  org          Organization @relation(fields: [orgId], references: [id])
  role         AgentRole @default(AGENT)
  isAvailable  Boolean  @default(false)
  sessions     Session[]
  createdAt    DateTime @default(now())
}

model Session {
  id           String        @id @default(cuid())
  orgId        String
  org          Organization  @relation(fields: [orgId], references: [id])
  channel      Channel       // VOICE | CHAT | SMS | WHATSAPP | EMAIL
  language     String        @default("auto")
  status       SessionStatus // ACTIVE | WAITING | BOT | HUMAN | RESOLVED | ABANDONED
  customerId   String?
  agentId      String?
  agent        Agent?        @relation(fields: [agentId], references: [id])
  messages     Message[]
  summary      String?
  sentiment    Float?        // -1.0 to 1.0
  resolvedByAI Boolean       @default(false)
  startedAt    DateTime      @default(now())
  endedAt      DateTime?
  createdAt    DateTime      @default(now())
}

model Message {
  id        String      @id @default(cuid())
  sessionId String
  session   Session     @relation(fields: [sessionId], references: [id])
  role      MessageRole // USER | BOT | AGENT | SYSTEM
  content   String
  audioUrl  String?
  createdAt DateTime    @default(now())
}

model KnowledgeDoc {
  id          String   @id @default(cuid())
  orgId       String
  org         Organization @relation(fields: [orgId], references: [id])
  title       String
  content     String
  pineconeId  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CallLog {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  twilioCallSid String?
  duration    Int?     // seconds
  recordingUrl String?
  transcript  String?
  qaScore     Float?
  createdAt   DateTime @default(now())
}

enum Plan { FREE STARTER PRO ENTERPRISE }
enum Channel { VOICE CHAT SMS WHATSAPP EMAIL }
enum SessionStatus { ACTIVE WAITING BOT HUMAN RESOLVED ABANDONED }
enum MessageRole { USER BOT AGENT SYSTEM }
enum AgentRole { AGENT SUPERVISOR ADMIN }
```

---

## 6. Core Feature Modules

### 6.1 Voice AI Pipeline (Inbound Calls)
- **Default (`VOICE_PIPELINE=vapi`)**: Telnyx Moroccan DID → Vapi → `POST /api/webhooks/vapi` (`assistant-request` builds the agent). Dashboard: Deploy → Phone. See `docs/phone-setup.md`.
- Businesses keep their carrier `+212` number via USSD call forwarding to the Telnyx DID (or use a provisioned DID directly).
- Legacy Twilio Media Streams (`/api/webhooks/twilio/voice` → `/ws/media-streams`) only when `VOICE_PIPELINE` is not `vapi`.
- Support **barge-in**: caller can interrupt prompts naturally
- Use DTMF (keypad) for sensitive data (PINs, card numbers) — never ask for these in voice
- Keep latency low; prefer streaming / realtime APIs
- Language: phone settings + agent default language; AR/Darija use cascaded STT+LLM+TTS
- Always provide fallback: if confidence is low or user says "human" / "agent", escalate

### 6.2 Chat & Messaging (Text Channels)
- Website chat widget: React component with WebSocket (Supabase Realtime)
- WhatsApp & SMS: Twilio webhook → `/api/webhooks/twilio/message`
- Same LLM pipeline as voice but skip ASR/TTS
- Support rich responses: buttons, quick replies, structured menus
- Omnichannel context: if customer switches from chat to call, bot has full history

### 6.3 AI Orchestration (OpenRouter)
- All LLM calls go through `lib/ai/llm.ts` — never call the API directly in components
- System prompts live in `lib/ai/prompts/` — one file per use case
- Use tool/function calling for: appointment booking, CRM lookups, order status, ticket creation
- After each session: auto-generate summary + update session record
- Sentiment scoring on every message; trigger escalation if sentiment < -0.6

### 6.4 Knowledge Base (Pinecone RAG)
- Documents uploaded in dashboard → chunked → embedded → upserted to Pinecone
- On every LLM call: query Pinecone for top-5 relevant chunks, inject into context
- Admin UI to manage, preview, and delete knowledge docs
- Support Arabic, French, English documents

### 6.5 Live Agent Dashboard
- Real-time session list with status indicators (Supabase Realtime subscriptions)
- Live transcript stream during active calls
- AI Co-pilot panel: shows suggested responses, knowledge snippets, compliance alerts
- One-click takeover: agent joins live call/chat, bot hands off full context
- Post-call: auto-summary displayed for agent review and edit before saving

### 6.6 Analytics & QA
- KPI cards: total sessions, bot resolution rate, avg handle time, CSAT
- Sentiment trend charts per day/week/month
- 100% call QA: every session scored automatically by the LLM
- Filter/search all transcripts; flag sessions for supervisor review
- Export reports as CSV

### 6.7 Outbound Campaigns
- Create campaigns with contact list CSV upload
- AI-powered voice bot makes outbound calls (reminders, surveys, appointment confirmations)
- Track delivery, answer rate, outcome per contact

---

## 7. Authentication & Multi-Tenancy (Clerk)

- All routes under `/dashboard` protected via Clerk middleware
- Every DB query **must** be scoped to the user's `orgId` — never query cross-tenant data
- Roles: `ADMIN`, `SUPERVISOR`, `AGENT` — enforce at API route level
- Clerk webhooks (`/api/webhooks/clerk`) sync user/org creation to Supabase
- Org switching supported natively via Clerk's `<OrganizationSwitcher />`

```ts
// Always get orgId like this in server code:
import { auth } from "@clerk/nextjs/server";
const { orgId, userId } = auth();
if (!orgId) throw new Error("Unauthorized");
```

---

## 8. Billing (LemonSqueezy)

- Plans: `FREE`, `STARTER`, `PRO`, `ENTERPRISE`
- Webhook at `/api/webhooks/lemonsqueezy` updates `Organization.plan` in DB
- Gate features by plan in middleware and UI — check `org.plan` before rendering premium features
- Pricing page at `/pricing` — use LemonSqueezy checkout links
- Never hardcode prices in UI; fetch from LemonSqueezy or config

---

---

## 10. Email (Resend)

- All transactional emails via `lib/resend/sender.ts`
- **Inbound AI (email channel):** Configure receiving on your domain in Resend (MX + domain verification). Webhook `email.received` → `POST /api/webhooks/email/inbound`. The handler verifies Svix signatures (`RESEND_WEBHOOK_SECRET`), fetches full message body via Resend’s Received Email API, routes by row in `EmailAddress`, then reuses `processMessage` + outbound `sendEmail`. Map mailboxes in Dashboard → **Inbound email** (`/dashboard/email`).
- Templates: new agent invite, session summary, weekly analytics digest, billing alerts
- Use React Email components for templates — store in `emails/` folder
- Always send from a verified domain; use `from: "noreply@yourdomain.com"`

---

## 11. Analytics (Google Analytics 4)

- GA4 initialized in root layout via `@next/third-parties/google`
- Track key events: `session_started`, `session_resolved_by_ai`, `agent_takeover`, `campaign_launched`, `upgrade_clicked`
- Never track PII — no names, phone numbers, or transcript content in GA events
- Custom dimensions: `channel`, `language`, `plan`

---

## 12. Security & Compliance Rules

These are **hard requirements** — never skip them:

- **HTTPS everywhere** — no HTTP endpoints
- **PII Sanitization**: strip names, phone numbers, account numbers from logs and GA events
- **DTMF for sensitive input**: never ask for PINs or card numbers verbally — route to keypad input
- **Encrypt at rest**: use Supabase's built-in encryption; never store raw recordings in public buckets
- **Secrets in env vars only** — never commit API keys; use `.env.local` and Vercel env management
- **Row-level security (RLS)** in Supabase — every table must have RLS policies scoped to `org_id`
- **Morocco Law 09-08 compliance** (data protection) + **GDPR-equivalent** practices
- **PCI DSS awareness**: if card payments handled, use DTMF + Twilio's PCI-compliant path
- **Consent prompts**: always play "this call may be recorded" message at call start
- **Human opt-out**: customer can always say "speak to human" and be escalated — this is non-negotiable
- **Rate limiting**: implement on all public webhooks and API routes (use Upstash or middleware)

---

## 13. Multilingual Requirements (Morocco-First)

- **Arabic (MSA + Darija)**: primary market language — test all voice flows in Arabic
- **French**: second official language — all UI text must support French
- **English**: international customers
- Whisper auto-detects language per session — store detected language on `Session.language`
- LLM system prompts must instruct: "Respond in the same language the customer is using"
- For Darija (Moroccan Arabic dialect): implement graceful fallback — if confidence is low, offer human escalation
- UI: support RTL layout for Arabic — use `dir="rtl"` and Tailwind's RTL utilities where needed

---

## 14. AI Prompt Guidelines

All prompts live in `lib/ai/prompts/`. Follow these rules:

```ts
// lib/ai/prompts/voice-bot.ts — example structure
export const voiceBotSystemPrompt = (org: Organization, language: string) => `
You are a helpful AI assistant for ${org.name}'s customer support team.
You are speaking with a customer over the phone. Be concise — voice responses should be 1-3 sentences max.
Always respond in ${language}.
You have access to the following tools: [check_order_status, book_appointment, create_ticket, lookup_account].
If you cannot resolve the issue, say so clearly and offer to transfer to a human agent.
Never ask for full credit card numbers or passwords verbally.
`;
```

- Keep voice responses **short** (1-3 sentences) — long responses are terrible on the phone
- Always include tool definitions for function calling
- Log all prompts for debugging (not in production)
- Version prompts — add `v1`, `v2` suffix when iterating

---

## 15. API Route Conventions

```ts
// All API routes follow this pattern:
export async function POST(req: Request) {
  try {
    const { orgId, userId } = auth();
    if (!orgId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    // validate with zod
    // perform action scoped to orgId
    // return result

    return Response.json({ success: true, data: result });
  } catch (err) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- Always validate request bodies with **Zod**
- Always scope DB queries to `orgId`
- Twilio webhooks must validate Twilio signature — use `twilio.validateRequest()`
- Return consistent shapes: `{ success: boolean, data?: T, error?: string }`

---

## 16. Real-Time (Supabase Realtime)

- Live call/chat updates use Supabase Realtime channels
- Subscribe in client components with `useEffect` + Supabase `channel().on('postgres_changes', ...)`
- Channel naming: `session:{sessionId}`, `org:{orgId}:active-sessions`
- Unsubscribe on component unmount — always return cleanup function

---

## 17. Development Workflow

```bash
# Install dependencies
npm install

# Dev server (reuse if already running; agents must not spawn extras)
npm run dev

# DB — push schema changes
npx prisma db push

# DB — generate client after schema change
npx prisma generate

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

### Dev servers (agents)

- Reuse a server that is already running. Do not start another `npm run dev` / `next dev` if one is healthy (Next will bind 3001, 3002, … and leave leftovers).
- Typecheck, lint, and most edits do not need a live server.
- If you start a server for UI/HTTP checks, **stop that process when done** — only the job you spawned. Never kill the user's own terminal or all `node` processes.

### Knowledge base (pgvector)

`KnowledgeChunk.embedding` is a **pgvector** column (1536 dimensions, matching `openai/text-embedding-3-small`). It is declared in `schema.prisma` as `Unsupported("vector(1536)")` so `prisma db push` can create it on new databases. Embeddings are still read and written with **raw SQL** in `lib/knowledge/vector-store.ts`.

If you see Postgres error `42703` (column `embedding` does not exist), or you are on an older database, apply the extension and column with:

```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/001_enable_pgvector.sql
```

The script is idempotent (`IF NOT EXISTS`). The optional `prisma/migrations/002_match_knowledge_chunks_function.sql` defines an RPC that this codebase does not call today.

### Environment Variables (required)
```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
DATABASE_URL=           # Prisma connection string (Supabase pooler)
DIRECT_URL=             # Prisma direct connection (for migrations)

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WEBHOOK_SECRET=

# AI (OpenRouter — single key for all LLM + embedding models)
OPENROUTER_API_KEY=

# TTS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# Pinecone
PINECONE_API_KEY=
PINECONE_INDEX_NAME=
PINECONE_ENVIRONMENT=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_WEBHOOK_SECRET=

# LemonSqueezy
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_STORE_ID=

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

---

## 18. What NOT to Do

- ❌ Never use `any` TypeScript type — use proper types or `unknown`
- ❌ Never query the DB without scoping to `orgId`
- ❌ Never call LLM APIs directly in React components — use server-side API routes (OpenRouter via `lib/ai/llm.ts`)
- ❌ Never store secrets in code or commit `.env` files
- ❌ Never skip Zod validation on user inputs
- ❌ Never create UI without reading `DESIGN.md` first
- ❌ Never use `console.log` in production code — use a proper logger
- ❌ Never ask customers for sensitive info (PINs, card numbers) via voice/text — use DTMF
- ❌ Never hardcode language strings for Arabic/French — use i18n keys
- ❌ Never skip error boundaries on dashboard pages

---

## 19. Feature Build Order (Reference Roadmap)

Follow this sequence when building features. Do not skip phases.

1. **Foundation** — Clerk auth, Supabase schema, Prisma setup, basic layout per `DESIGN.md`
2. **Telephony Core** — Twilio inbound webhook, TwiML response, basic IVR
3. **Voice AI Pipeline** — Whisper ASR → OpenRouter LLM → TTS, session storage
4. **Chat Channel** — Web widget, Supabase Realtime, same LLM pipeline
5. **SMS/WhatsApp** — Twilio messaging webhooks, unified message handling
6. **Knowledge Base** — Document upload, Pinecone indexing, RAG in prompts
7. **Agent Dashboard** — Live sessions, transcript view, takeover, co-pilot panel
8. **Post-Call Automation** — Auto-summary, sentiment score, CRM hooks
9. **Analytics & QA** — KPI dashboard, auto-QA scoring, export
10. **Outbound Campaigns** — Dialer, contact lists, campaign tracking
11. **Billing** — LemonSqueezy integration, plan gating, upgrade flows
12. **Advanced** — Outbound AI, workforce scheduling, compliance layer

---

## 20. Reference Documentation

| Resource | URL |
|---|---|
| Next.js App Router | https://nextjs.org/docs |
| Clerk Docs | https://clerk.com/docs |
| Supabase Docs | https://supabase.com/docs |
| Prisma Docs | https://www.prisma.io/docs |
| Twilio Voice | https://www.twilio.com/docs/voice |
| Twilio Media Streams | https://www.twilio.com/docs/voice/media-streams |
| OpenRouter Docs | https://openrouter.ai/docs |
| Pinecone Docs | https://docs.pinecone.io |
| LemonSqueezy Docs | https://docs.lemonsqueezy.com |
| Resend Docs | https://resend.com/docs |


---

*Last updated: May 2026 — Any AI agent reading this must treat it as the highest-priority instruction file in the project, second only to `DESIGN.md` for all UI work.*
