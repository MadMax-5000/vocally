export function getAssemblyAiApiKey(): string {
  const key = process.env.ASSEMBLYAI_API_KEY?.trim();
  if (!key) throw new Error("ASSEMBLYAI_API_KEY is not configured");
  return key;
}

export function isAssemblyAiConfigured(): boolean {
  return Boolean(process.env.ASSEMBLYAI_API_KEY?.trim());
}

/** Signing secret for webhooks and HTTP tool bearer auth. */
export function getAssemblyAiWebhookSecret(): string | null {
  const secret = process.env.ASSEMBLYAI_WEBHOOK_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

export function getAssemblyAiToolSecret(): string | null {
  return getAssemblyAiWebhookSecret();
}
