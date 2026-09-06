# Phone channel setup (Morocco)

Inbound voice is **BYOC / BYOP**: the business keeps its IAM / Orange / Inwi (or VoIP integrator) number. Anselio does **not** resell Moroccan DIDs — local integrators confirm wholesale DID sales are not permitted; only technical BYOC/BYOP is.

Conversation engine by language:

- **English / French** — AssemblyAI Voice Agent API (`sip:sip.assemblyai.com`)
- **Arabic / Darija / mixed-with-Arabic** — Vapi cascaded path (needs a platform forward DID when inventory exists)

## How it works (primary)

1. User opens Dashboard → Agent → Deploy → Phone
2. Enters their existing Moroccan number (`+212…` or `06…`)
3. Anselio registers the number with AssemblyAI (EN/FR) and shows SIP routing instructions
4. Customer (or VoIPSense / carrier) routes inbound SIP for that DID to `sip:sip.assemblyai.com`
5. Callers dial the business number → AI answers

Optional USSD path: if `PHONE_BYOC_TRY_PBXME=1` and PBXme has inventory, Anselio can buy a silent forward DID and show `*21*{nationalDID}#` instead.

## Setup

### 1. Environment

```bash
# Public URL (HTTP tools + webhooks)
NEXT_PUBLIC_APP_URL=https://your-public-domain

# AssemblyAI (EN/FR phone pipeline) — required for BYOC
ASSEMBLYAI_API_KEY=your_assemblyai_key
ASSEMBLYAI_WEBHOOK_SECRET=at-least-32-characters-long-secret

# Optional: attempt platform DID buy for USSD forwarding
# PHONE_BYOC_TRY_PBXME=1
# PBXME_USERNAME=
# PBXME_PASSWORD=
# PBXME_X_AUTH_TOKEN=

# Vapi (required for Arabic/Darija)
VAPI_API_KEY=your_vapi_key
```

### 2. Schema

```bash
npx prisma db push
npx prisma generate
```

### 3. Test

1. Deploy → Phone → enable channel
2. Enter a Moroccan business number → **Connect number**
3. Configure SIP BYOP with your carrier/integrator to `sip:sip.assemblyai.com`
4. Place a test call to the business number

Optional SIP spike:

```bash
npx tsx --env-file=.env.local scripts/spike-assemblyai-sip.ts +2125...
```

## Carrier forwarding (USSD) — only when a forward DID exists

When a platform forward DID is provisioned:

- **Mobile:** dial `*21*{nationalDID}#` from the business SIM (cancel with `#21#`)
- **Landline:** set unconditional forwarding in the carrier account/app

## Supported approaches

| Approach | Status | Notes |
|---|---|---|
| **BYOC / BYOP (recommended)** | ✅ | Keep carrier number; SIP to AssemblyAI |
| **USSD to platform DID** | Optional | Needs wholesale DID inventory |
| **KataTelecom / CommPeak** | Sales | Possible source for *your* ops DID pool — not customer self-serve |
| **VoIPSense** | BYOC only | Confirmed: DID resale not allowed in Morocco |
