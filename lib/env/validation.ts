import { isLocalhostUrl } from "@/lib/app-url";

const CRITICAL_VARS: { key: string; label: string }[] = [
  { key: "DATABASE_URL", label: "Prisma database connection string" },
  { key: "DIRECT_URL", label: "Prisma direct database connection" },
  { key: "OPENROUTER_API_KEY", label: "OpenRouter API key for LLM/embeddings" },
  { key: "CLERK_SECRET_KEY", label: "Clerk secret key" },
  { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", label: "Clerk publishable key" },
  { key: "TWILIO_ACCOUNT_SID", label: "Twilio account SID" },
  { key: "TWILIO_AUTH_TOKEN", label: "Twilio auth token" },
  { key: "VAPI_API_KEY", label: "Vapi API key" },
  { key: "HANDOFF_PHONE_NUMBER", label: "Human agent handoff phone number" },
];

/** Required to provision / receive phone calls (checked at deploy time). */
const PHONE_DEPLOY_VARS: { key: string; label: string }[] = [
  { key: "NEXT_PUBLIC_APP_URL", label: "Public app URL (Vapi phone serverUrl)" },
  { key: "VAPI_API_KEY", label: "Vapi API key" },
  { key: "PBXME_USERNAME", label: "PBXme username (Moroccan number provisioning)" },
  { key: "PBXME_PASSWORD", label: "PBXme password" },
];

let _validated = false;

export function validateEnv(): void {
  if (_validated) return;
  _validated = true;

  if (process.env.NODE_ENV === "test") return;

  const missing: { key: string; label: string }[] = [];

  for (const v of CRITICAL_VARS) {
    if (!process.env[v.key]) {
      missing.push(v);
    }
  }

  if (missing.length > 0) {
    const details = missing
      .map((m) => `  • ${m.key} — ${m.label}`)
      .join("\n");
    throw new Error(
      `Missing critical environment variables:\n${details}\n\n` +
        `Set them in your .env.local file or environment configuration.\n` +
        `See .env.example and docs/phone-setup.md for phone channel setup.`,
    );
  }

  if (process.env.VERCEL_ENV === "production") {
    const localhostKeys = [
      "NEXT_PUBLIC_APP_URL",
      "GOOGLE_OAUTH_REDIRECT_URI",
      "GOOGLE_CALENDAR_OAUTH_REDIRECT_URI",
      "CALENDLY_OAUTH_REDIRECT_URI",
      "META_OAUTH_REDIRECT_URI",
    ].filter((key) => {
      const value = process.env[key]?.trim();
      return Boolean(value && isLocalhostUrl(value));
    });

    if (localhostKeys.length > 0) {
      const details = localhostKeys.map((key) => `  • ${key}=${process.env[key]}`).join("\n");
      throw new Error(
        `Production environment points at localhost. OAuth and embeds will redirect to localhost:3000.\n${details}\n\n` +
          `Set these to https://anselio.com (and matching callback paths) in Vercel Production, then redeploy.\n` +
          `NEXT_PUBLIC_* changes are inlined at build time — a redeploy is required.`,
      );
    }
  }
}

/**
 * Throws if phone deploy env is incomplete.
 * Call before Vapi provisioning.
 */
export function assertPhoneDeployEnv(): void {
  const missing = PHONE_DEPLOY_VARS.filter((v) => !process.env[v.key]?.trim());
  if (missing.length === 0) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (appUrl && isLocalhostUrl(appUrl) && process.env.VERCEL_ENV === "production") {
      throw new Error(
        "Phone deploy is not configured:\n  • NEXT_PUBLIC_APP_URL must be https://anselio.com in production (not localhost)\n\nSee docs/phone-setup.md.",
      );
    }
    return;
  }

  const details = missing.map((m) => `  • ${m.key} — ${m.label}`).join("\n");
  throw new Error(
    `Phone deploy is not configured:\n${details}\n\nSee docs/phone-setup.md.`,
  );
}
