import { getGmailClientForAgent } from "./client";

export type GmailLabelOption = {
  id: string;
  name: string;
  type: string;
};

/** System labels allowed for users.watch filtering. */
const WATCHABLE_SYSTEM_LABELS = new Set(["INBOX"]);

export async function listGmailLabels(
  agentId: string,
  orgId: string,
): Promise<GmailLabelOption[]> {
  const { gmail } = await getGmailClientForAgent(agentId, orgId);
  const res = await gmail.users.labels.list({ userId: "me" });
  const labels = res.data.labels ?? [];

  return labels
    .filter(
      (l) =>
        l.id &&
        l.name &&
        (l.type === "user" || WATCHABLE_SYSTEM_LABELS.has(l.id)),
    )
    .map((l) => ({
      id: l.id!,
      name: l.name!,
      type: l.type ?? "user",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function resolveLabelNames(
  labelIds: string[],
  options: GmailLabelOption[],
): string[] {
  const byId = new Map(options.map((o) => [o.id, o.name]));
  return labelIds.map((id) => byId.get(id) ?? id);
}

export function formatGmailApiError(err: unknown): string {
  if (err && typeof err === "object") {
    const gaxios = err as {
      message?: string;
      response?: { data?: { error?: { message?: string } } };
    };
    const apiMsg = gaxios.response?.data?.error?.message;
    if (apiMsg) return apiMsg;
    if (gaxios.message) return gaxios.message;
  }
  if (err instanceof Error) return err.message;
  return "Unknown Gmail API error";
}
