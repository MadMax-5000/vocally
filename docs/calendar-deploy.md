# Calendar booking (Google Calendar + Calendly)

Per-agent OAuth so the AI can list real free slots and create events. Bookings are still stored in Anselio. When no calendar is connected, booking stays Anselio-only.

Doctolib is not supported.

## Google Calendar

1. In the same GCP project used for Gmail, enable **Google Calendar API**.
2. OAuth consent screen: add scopes
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.freebusy`
   - `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
3. OAuth client (Web application) authorized redirect URI:
   - `https://anselio.com/api/oauth/google-calendar/callback` (production)
   - `http://localhost:3000/api/oauth/google-calendar/callback` for local dev only — do not use this URI in Vercel Production
4. Reuse `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

This flow is **separate** from Gmail (`/api/oauth/google/callback`). A clinic can connect a calendar without connecting Gmail.

## Calendly

1. Create an OAuth app at [developer.calendly.com](https://developer.calendly.com/).
2. Redirect URI: `https://anselio.com/api/oauth/calendly/callback` (production). Keep a localhost URI only on a Calendly development app.
3. **Create Invitee (`POST /invitees`) requires a paid Calendly plan** (Standard or higher). Listing event types may work on a free plan; booking will fail with a clear error if the plan cannot create invitees.

## Environment variables

```bash
# Optional; defaults to NEXT_PUBLIC_APP_URL + /api/oauth/google-calendar/callback
GOOGLE_CALENDAR_OAUTH_REDIRECT_URI=

CALENDLY_CLIENT_ID=
CALENDLY_CLIENT_SECRET=
# Optional; defaults to NEXT_PUBLIC_APP_URL + /api/oauth/calendly/callback
CALENDLY_OAUTH_REDIRECT_URI=

# Already required for Gmail token encryption
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TOKEN_ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=
```

## Dashboard

Agent → Actions → Book appointment:

- **Anselio only** — store the booking without checking a live calendar
- **Google Calendar** — connect, pick a calendar, set timezone, duration, and working hours
- **Calendly** — connect, pick one event type (duration and buffers come from Calendly)

One calendar provider per agent. Connecting Calendly replaces Google and vice versa.

## How the AI books

When a live calendar is connected:

1. `list_available_slots` reads Google free/busy (intersected with working hours) or Calendly available times
2. The model offers 2–4 of those times only
3. `book_appointment` re-checks the slot, creates the Google event or Calendly invitee, then writes the Anselio `Appointment` row with `externalEventId`

Empty Google calendars at night are **not** offered — working hours are required.
