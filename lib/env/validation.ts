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
}

/**
 * Throws if phone deploy env is incomplete.
 * Call before Vapi provisioning.
 */
export function assertPhoneDeployEnv(): void {
  const missing = PHONE_DEPLOY_VARS.filter((v) => !process.env[v.key]?.trim());
  if (missing.length === 0) return;

  const details = missing.map((m) => `  • ${m.key} — ${m.label}`).join("\n");
  throw new Error(
    `Phone deploy is not configured:\n${details}\n\nSee docs/phone-setup.md.`,
  );
}
