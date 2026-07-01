"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import { updateCustomButtonActionSettings } from "@/lib/actions/agents";
import { Switch } from "@/components/ui/switch";

import { CustomButtonsEditor } from "./CustomButtonsEditor";
import {
  ActionSheetEmpty,
  ActionSheetEnableRow,
  ActionSheetShell,
} from "./ActionSheetShell";
import {
  buildCustomButtonActionDraft,
  draftsEqual,
  validateCustomButtonDraft,
  type CustomButtonActionDraft,
} from "./custom-button-action-draft";

type CustomButtonActionSheetProps = {
  agent: AgentDetailWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CustomButtonActionSheet({
  agent,
  open,
  onOpenChange,
}: CustomButtonActionSheetProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedDraft, setSavedDraft] = useState<CustomButtonActionDraft>(() =>
    buildCustomButtonActionDraft(agent),
  );
  const [draft, setDraft] = useState<CustomButtonActionDraft>(() =>
    buildCustomButtonActionDraft(agent),
  );

  useEffect(() => {
    if (!open) return;
    const next = buildCustomButtonActionDraft(agent);
    setSavedDraft(next);
    setDraft(next);
  }, [agent, open]);

  const isDirty = !draftsEqual(draft, savedDraft);
  const validationError = validateCustomButtonDraft(draft);

  function handleSave() {
    const err = validateCustomButtonDraft(draft);
    if (err) {
      toast.error(err);
      return;
    }

    startTransition(async () => {
      const result = await updateCustomButtonActionSettings(agent.id, {
        enabled: draft.enabled,
        buttons: draft.enabled
          ? draft.buttons
              .filter((b) => b.label.trim())
              .map((b) => {
                if (b.kind === "message") {
                  return {
                    label: b.label.trim(),
                    kind: "message" as const,
                    message: (b.message ?? "").trim(),
                  };
                }
                return {
                  label: b.label.trim(),
                  kind: "link" as const,
                  href: (b.href ?? "").trim(),
                  openInNewTab: b.openInNewTab !== false,
                };
              })
          : undefined,
      });
      if (!result.success) {
        toast.error(result.error ?? "Save failed");
        return;
      }
      const next = buildCustomButtonActionDraft(result.data);
      setSavedDraft(next);
      setDraft(next);
      router.refresh();
      toast.success("Custom buttons saved");
      onOpenChange(false);
    });
  }

  return (
    <ActionSheetShell
      open={open}
      onOpenChange={onOpenChange}
      title="Custom button"
      description="Add quick-action buttons above the chat input. Use links for external pages or preset messages to start a conversation topic."
      pending={pending}
      isDirty={isDirty}
      saveDisabled={Boolean(validationError)}
      onSave={handleSave}
    >
      <ActionSheetEnableRow label="Enable custom buttons">
        <Switch
          id="custom-button-enabled"
          checked={draft.enabled}
          onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
        />
      </ActionSheetEnableRow>

      {draft.enabled ? (
        <CustomButtonsEditor
          buttons={draft.buttons}
          onChange={(buttons) => setDraft((d) => ({ ...d, buttons }))}
        />
      ) : (
        <ActionSheetEmpty>Turn on to add buttons above the chat composer.</ActionSheetEmpty>
      )}
    </ActionSheetShell>
  );
}
