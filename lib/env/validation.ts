const CRITICAL_VARS: { key: string; label: string }[] = [
  { key: "DATABASE_URL", label: "Prisma database connection string" },
  { key: "DIRECT_URL", label: "Prisma direct database connection" },
  { key: "OPENROUTER_API_KEY", label: "OpenRouter API key for LLM/embeddings" },
  { key: "CLERK_SECRET_KEY", label: "Clerk secret key" },
  { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", label: "Clerk publishable key" },
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
        `See .env.example for the full list of available variables.`,
    );
  }
}
