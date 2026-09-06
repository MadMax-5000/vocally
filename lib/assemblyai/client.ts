import { randomUUID } from "crypto";

import { getAssemblyAiApiKey } from "./env";
import { ASSEMBLYAI_TERMINATION_URI } from "./sip";

const AGENTS_BASE = "https://agents.assemblyai.com";
const PHONE_BASE = "https://agents.us.assemblyai.com";

export type AssemblyAiHttpTool = {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
  timeout_seconds?: number;
  execution_mode?: "interactive" | "hold";
  http: {
    url: string;
    http_method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Array<{ name: string; value?: string; remove?: boolean }>;
  };
};

export type AssemblyAiAgentPayload = {
  name: string;
  system_prompt: string;
  greeting?: string;
  voice: { voice_id: string };
  input?: {
    format?: { encoding: "audio/pcm" | "audio/pcmu" | "audio/pcma"; sample_rate?: number };
    language_codes?: string[];
    keyterms?: string[];
    turn_detection?: { interrupt_response?: boolean };
    transcription_mode?: "min_latency" | "balanced" | "max_accuracy";
  };
  output?: {
    voice?: string;
    format?: { encoding: "audio/pcm" | "audio/pcmu" | "audio/pcma"; sample_rate?: number };
  };
  tools?: AssemblyAiHttpTool[];
};

export type AssemblyAiAgentRecord = AssemblyAiAgentPayload & {
  id: string;
};

export type AssemblyAiSessionArtifact = {
  type: "audio" | "timeline" | "metadata" | string;
  url: string;
  content_type?: string;
};

export type AssemblyAiSessionRecord = {
  id: string;
  agent_id?: string;
  status: string;
  duration_seconds?: number;
  artifacts?: AssemblyAiSessionArtifact[];
};

export type AssemblyAiWebhookSubscription = {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
};

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: getAssemblyAiApiKey(),
    "Content-Type": "application/json",
    ...extra,
  };
}

async function readError(res: Response): Promise<string> {
  const text = await res.text();
  return text.slice(0, 500);
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`AssemblyAI ${init.method ?? "GET"} ${url} failed: ${res.status} ${await readError(res)}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export async function createAgent(payload: AssemblyAiAgentPayload): Promise<AssemblyAiAgentRecord> {
  return requestJson<AssemblyAiAgentRecord>(`${AGENTS_BASE}/v1/agents`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateAgent(
  agentId: string,
  payload: Partial<AssemblyAiAgentPayload>,
): Promise<AssemblyAiAgentRecord> {
  return requestJson<AssemblyAiAgentRecord>(`${AGENTS_BASE}/v1/agents/${agentId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function getAgent(agentId: string): Promise<AssemblyAiAgentRecord> {
  return requestJson<AssemblyAiAgentRecord>(`${AGENTS_BASE}/v1/agents/${agentId}`, {
    method: "GET",
    headers: authHeaders(),
  });
}

export async function importPhoneNumber(phoneNumber: string, terminationUri = ASSEMBLYAI_TERMINATION_URI): Promise<void> {
  const res = await fetch(`${PHONE_BASE}/v1/phone-numbers/import`, {
    method: "POST",
    headers: authHeaders({ "Idempotency-Key": randomUUID() }),
    body: JSON.stringify({
      phone_number: phoneNumber,
      termination_uri: terminationUri,
    }),
  });

  if (res.ok || res.status === 409) return;
  throw new Error(`AssemblyAI phone import failed: ${res.status} ${await readError(res)}`);
}

export async function bindPhoneNumberAgent(phoneNumber: string, agentId: string): Promise<void> {
  await requestJson<unknown>(`${PHONE_BASE}/v1/phone-numbers/${encodeURIComponent(phoneNumber)}/agent`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ agent_id: agentId }),
  });
}

export async function getSession(sessionId: string): Promise<AssemblyAiSessionRecord> {
  return requestJson<AssemblyAiSessionRecord>(`${AGENTS_BASE}/v1/sessions/${sessionId}`, {
    method: "GET",
    headers: authHeaders(),
  });
}

export async function listWebhookSubscriptions(): Promise<AssemblyAiWebhookSubscription[]> {
  const data = await requestJson<{ subscriptions?: AssemblyAiWebhookSubscription[] } | AssemblyAiWebhookSubscription[]>(
    `${AGENTS_BASE}/v1/webhook-subscriptions`,
    { method: "GET", headers: authHeaders() },
  );
  if (Array.isArray(data)) return data;
  return data.subscriptions ?? [];
}

export async function createWebhookSubscription(params: {
  url: string;
  events: string[];
  secret: string;
}): Promise<AssemblyAiWebhookSubscription> {
  return requestJson<AssemblyAiWebhookSubscription>(`${AGENTS_BASE}/v1/webhook-subscriptions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      url: params.url,
      events: params.events,
      secret: params.secret,
    }),
  });
}
