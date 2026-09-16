# Phone channel setup (Morocco)

Anselio does **not** resell Moroccan DIDs. Twilio, Telnyx, DIDWW, and similar shops
do not sell a legal self-serve `+212`. Inbound voice is:

    caller → IAM / Orange / Inwi → last mile → SIP → Vapi (AR/Darija) or AssemblyAI (EN/FR)

Last mile (pick one, in this order):

1. **SIPTRUNK.ma** — they provision a Moroccan `05` + SIP credentials for *our* Vapi agent
2. **GoIP-1 + one Anselio SIM** — the box INVITEs `sip:anselio-{agentId}@sip.vapi.ai`
3. **Customer already has SIP/PBX** — they trunk or forward to the same Vapi SIP URI
4. **VoIPSense OpenVox kit** — only when a paying client covers the 4 900 DH setup

Conversation engine:

- **English / French** — AssemblyAI when that path is configured (no Arabic TTS yet)
- **Arabic / Darija / mixed-with-Arabic** — Vapi cascaded path

One SIM / one Vapi SIP URI = **one concurrent call** unless the provider gives more
channels. Do not share one SIM across two paying offices.

`NEXT_PUBLIC_APP_URL` must be **public HTTPS** or Vapi cannot hit `/api/webhooks/vapi`.

---

## 1. WhatsApp SIPTRUNK.ma first (do this before buying hardware)

Vendor: [SIPTRUNK.ma](https://siptrunk.ma/) (WeConnect, Casablanca).

- Phone: +212 520 974 141
- Email: siptrunk@weconnect.ma
- WhatsApp: +212 675 752 429

Copy-paste (FR):

```
Bonjour,

Nous sommes Anselio (agents vocaux IA). Nous avons déjà Vapi + un webhook HTTPS.
Nous ne voulons pas votre agent WeConnect — seulement le dernier kilomètre Maroc.

Merci de confirmer par écrit :

1. Vous nous livrez un numéro marocain test (idéalement 05) + une adresse SIP
   (serveur, identifiant, mot de passe, transport) à coller dans Vapi,
   ou vous originerez vers sip:NOUS_VOUS_DONNONS_L_URI@sip.vapi.ai.
2. Un mobile Orange, un Inwi et un IAM peuvent appeler ce 05 : sonnerie + audio
   bidirectionnel vers notre assistant (pas votre SVI).
3. Tarifs : DH HT par numéro / mois, par canal simultané, par minute entrante,
   KYC (ICE).
4. Pouvez-vous raccorder le 06/07 existant d’un client (SIM dans une passerelle
   GSM, FXO, ou *21*) ou seulement les 05 que vous émettez ?

Si 1 et 2 sont OK, on commande. Merci.
```

If they wholesale and the test `05` rings from all three operators: **buy their pipe**.
Dashboard → Agent → Deploy → Phone → **Import SIP cards** (or ask them to originate
to the Vapi SIP URI from step 2). Skip GoIP and skip the VoIPSense kit.

If they refuse wholesale or the number does not ring: GoIP lab below.

---

## 2. Lab without VoIPSense (GoIP-1 + 1 SIM)

Cost: GoIP-1 ~1 000–1 800 DH once + one postpaid SIM in the company ICE
(~100–200 DH TTC / month). Incoming to a Moroccan mobile is normally **free**.

1. Buy a **GoIP-1** (GSM 900/1800) and **1 postpaid SIM** (full-size / chariot adapter
   if the SIM is nano).
2. Fibre on. Plug ethernet + the SIM.
3. Dashboard → Agent → Deploy → Phone → enable Phone → **Create SIP URI**.
   Copy `sip:anselio-{agentId}@sip.vapi.ai`.
4. On the GoIP, set inbound GSM → SIP dial that URI (forward to VoIP / trunk
   gateway). The box is a SIP *client* calling Vapi. No cloud PBX, no 250 DH/month.
5. Call the SIM from another phone. AI must answer. Status flips after the first
   successful inbound.
6. If RTP/NAT fails: GoIP registers to a tiny Asterisk/FreeSWITCH on a VPS, which
   INVITEs the same Vapi URI. Still cheaper than 4 260 DH.

---

## 3. First paying client (keep their number)

Eligible: **Pro** (1 number included) or Enterprise — not Free / Starter.

| Line | Amount (HT) |
|---|---|
| Included on Pro | 1 number + 300 AI minutes |
| Extra number pack / month | 1 500 DH |
| Included per pack | +1 number, 300 AI minutes, 1 concurrent line |
| Extra concurrent line / month | 200 DH |
| Extra WhatsApp / Meta account / month | 100 DH |
| Extra minutes | 3 DH / min |

Do **not** discount below 2.9 DH/min. Do **not** sell unlimited minutes.
Constants: `lib/billing/phone-addon.ts`.

### Client playbook (give them this)

The client keeps their published `05` / `06` / `07`. Callers still dial **that**
number. The AI answers because the line is forwarded to **your** SIM (or to a
SIPTRUNK.ma DID you assigned them).

**Mobile (postpaid IAM / Orange / Inwi)**

1. From the **business** phone, dial `*21*{nationalSIM}#`
   (national SIM = `0` + 9 digits, e.g. `0612345678`).
2. Cancel: `##21#` (some handsets accept `#21#`).
3. Check: `*#21#`.
4. A friend calls the **office** number. AI answers.

**Landline `05`**

USSD often does not work. In the operator account / app, set **unconditional /
renvoi inconditionnel** to the SIM national number.

**Prepaid**

Orange prepaid and IAM Jawal often **cannot** `*21*`. The client needs postpaid
(or they put their business SIM in the GoIP and stop using that SIM in a handset).

**What the client pays**

`*21*` is billed by **their** operator as a normal call to your SIM (often
included in a forfait, otherwise ~1–4 DH/min). Incoming on **your** SIM is free.
Tell them in writing before go-live.

If they put **their** business SIM in the gateway instead of forwarding, that
extra is 0 — but that phone can no longer use that SIM.

**Concurrency**

GoIP-1 = **one** call at a time. New office = new SIM / channel, not a second
forward onto the same SIM.

---

## 4. Import SIP cards (SIPTRUNK.ma or VoIPSense)

When the vendor gives server + username + password + a `+212`:

1. Deploy → Phone → **Import SIP cards**
2. SIM / SIP number = the `+212` they issued (or the SIM in the box)
3. SIP server, username, password from the carte (hostname is fine — do not type
   `sip:…@sip.vapi.ai` into the server field)
4. Provider name: `SIPTRUNK.ma` or `VoIPSense`
5. Optional: client office number if they will `*21*` to this SIM
6. Call the SIM / DID. AI must answer.

Do not ask VoIPSense to trunk to `sip:…@sip.vapi.ai` — they refused; paste **their**
cartes instead. SIPTRUNK.ma may originate to our URI; that is the other valid path.

---

## 5. VoIPSense kit (only if a client pays setup)

OpenVox SWG-M202 + 250 DH HT/month cloud SIP. Devis ~4 260 DH TTC then 250 HT/month.
Two simultaneous calls. Confirm in writing that cartes SIP land on Vapi, not their
IVR. SIMs in **your** company name, Grand Format. One kit = one office.

Do not order this to unblock v1.

---

## Environment

```bash
NEXT_PUBLIC_APP_URL=https://your-public-domain
VAPI_API_KEY=your_vapi_key
ASSEMBLYAI_API_KEY=your_assemblyai_key
ASSEMBLYAI_WEBHOOK_SECRET=at-least-32-characters-long-secret
```

```bash
npx prisma db push
npx prisma generate
```

## What not to do

- Do not enable `PHONE_BYOC_TRY_PBXME` for customer self-serve DID buy.
- Do not forward Moroccan numbers to a foreign Twilio DID.
- Do not put two paying offices on one SIM.
- Do not promise AssemblyAI Darija speech — it can transcribe Arabic; it cannot
  speak Arabic yet. Keep Vapi for AR/Darija.
