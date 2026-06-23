import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import type { CustomButtonItem } from "@/lib/deploy/custom-button-action";
import { resolveCustomButtonAction } from "@/lib/deploy/custom-button-action";

export type CustomButtonActionDraft = {
  enabled: boolean;
  buttons: CustomButtonItem[];
};

export function buildCustomButtonActionDraft(
  agent: AgentDetailWithRelations,
): CustomButtonActionDraft {
  const resolved = resolveCustomButtonAction(agent.channels);
  return {
    enabled: resolved.enabled,
    buttons: resolved.buttons.map((b) => ({ ...b })),
  };
}

function buttonsEqual(a: CustomButtonItem[], b: CustomButtonItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((btn, i) => {
    const other = b[i];
    if (btn.label !== other.label || btn.kind !== other.kind) return false;
    if (btn.kind === "message") {
      return btn.message === other.message;
    }
    return (
      btn.href === other.href && (btn.openInNewTab ?? true) === (other.openInNewTab ?? true)
    );
  });
}

export function draftsEqual(
  a: CustomButtonActionDraft,
  b: CustomButtonActionDraft,
): boolean {
  return a.enabled === b.enabled && buttonsEqual(a.buttons, b.buttons);
}

export function validateCustomButtonDraft(draft: CustomButtonActionDraft): string | null {
  if (!draft.enabled) return null;
  for (const btn of draft.buttons) {
    if (!btn.label.trim()) return "Each button needs a label";
    if (btn.kind === "message") {
      if (!btn.message?.trim()) return "Message buttons need preset text";
      if ((btn.message?.length ?? 0) > 200) return "Preset text must be 200 characters or less";
    } else {
      const href = btn.href?.trim() ?? "";
      if (!href) return "Link buttons need a URL";
      if (!href.startsWith("https://")) return "Links must use HTTPS";
      try {
        new URL(href);
      } catch {
        return "Enter a valid HTTPS URL";
      }
    }
  }
  return null;
}
