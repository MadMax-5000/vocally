# Phone channel setup (Morocco)

Inbound voice uses **PBXme** + **Vapi BYO SIP**. The platform automatically provisions Moroccan +212 numbers from PBXme and connects them to your AI agent.

**Zero friction:** Users click "Get a Number" — the backend handles everything.

## How it works

1. Platform buys a Moroccan DID from PBXme (~$3/month)
2. PBXme forwards calls to Vapi BYO SIP endpoint
3. Vapi handles AI voice (STT → LLM → TTS)
4. User gets a working Moroccan number instantly

## Setup

### 1. Create a PBXme account

1. Go to https://newsip.pbxme.com/signup/
2. Create an account (free $5 credit)
3. Note your username and password

### 2. Set environment variables

```bash
# PBXme credentials
PBXME_USERNAME=your_username
PBXME_PASSWORD=your_password

# Vapi (required)
VAPI_API_KEY=your_vapi_key
NEXT_PUBLIC_APP_URL=https://your-public-domain
```

### 3. Push database schema

```bash
npx prisma db push
npx prisma generate
```

### 4. Test the integration

1. Go to Dashboard → Agent → Deploy → Phone
2. Click "Get a Moroccan Number"
3. The system will:
   - Search available Moroccan numbers on PBXme
   - Purchase the first available one
   - Create Vapi BYO SIP credential
   - Forward the PBXme DID to Vapi
   - Save to database
4. The number appears as active (activation takes 2-5 business days)

## Manual SIP import

Users can also import their own SIP numbers:

1. Enter the DID number, SIP server, username, and password
2. Our code creates a BYO SIP credential in Vapi and imports the number
3. Optionally enter carrier number for USSD forwarding

## Carrier forwarding (for BYO numbers)

Businesses keep their carrier number (`+212…`) and forward calls to the AI DID via USSD (`*21*{nationalDID}#`).

**Mobile:** dial the USSD code from the business SIM.
**Landline:** USSD often does not apply — set unconditional call forwarding in carrier account/app.

## Pricing

- **PBXme numbers:** ~$3/month (local landlines, no KYC)
- **Toll-free:** ~$11/month
- **Mobile:** Requires KYC (ID + company registration)

## Supported providers

| Provider | Moroccan DIDs | Price | Notes |
|---|---|---|---|
| **PBXme** (recommended) | ✅ | ~$3/mo | Self-serve, no KYC for landlines |
| **VoIPSense** | ✅ | Contact sales | Moroccan local provider |
| **AVOXI** | ✅ | Contact sales | Online purchase |
| Any SIP provider | — | — | Enter SIP credentials manually |
