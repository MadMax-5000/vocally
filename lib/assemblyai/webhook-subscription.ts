import { getAppOrigin } from "@/lib/app-url";
import { logServerWarning } from "@/lib/logger";

import { createWebhookSubscription, listWebhookSubscriptions } from "./client";
import { getAssemblyAiWebhookSecret, isAssemblyAiConfigured } from "./env";

const WEBHOOK_EVENTS = ["session.completed", "call.connected", "call.ended"] as const;

let _ensured = false;

export function getAssemblyAiWebhookUrl(): string {
  return `${getAppOrigin()}/api/webhooks/assemblyai`;
}

export async function ensureAssemblyAiWebhookSubscription(): Promise<void> {
  if (_ensured) return;
  if (!isAssemblyAiConfigured()) return;

  const secret = getAssemblyAiWebhookSecret();
  if (!secret) {
    logServerWarning("[AssemblyAI] Skipping webhook subscription — ASSEMBLYAI_WEBHOOK_SECRET missing or too short", {});
    return;
  }

  const url = getAssemblyAiWebhookUrl();
  try {
    const existing = await listWebhookSubscriptions();
    const match = existing.find((sub) => sub.url === url && sub.enabled);
    if (match) {
      _ensured = true;
      return;
    }
    await createWebhookSubscription({
      url,
      events: [...WEBHOOK_EVENTS],
      secret,
    });
    _ensured = true;
  } catch (err) {
    logServerWarning("[AssemblyAI] Failed to ensure webhook subscription", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
