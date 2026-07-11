"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashboard.actions");
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
      toast.error(t(`validation.${err}`));
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
        toast.error(result.error ?? t("sheet.saveFailed"));
        return;
      }
      const next = buildCustomButtonActionDraft(result.data);
      setSavedDraft(next);
      setDraft(next);
      router.refresh();
      toast.success(t("sheet.customButton.saved"));
      onOpenChange(false);
    });
  }

  return (
    <ActionSheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("catalog.customButton.title")}
      description={t("sheet.customButton.description")}
      pending={pending}
      isDirty={isDirty}
      saveDisabled={Boolean(validationError)}
      onSave={handleSave}
    >
      <ActionSheetEnableRow label={t("sheet.customButton.enable")}>
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
        <ActionSheetEmpty>{t("sheet.customButton.disabledDescription")}</ActionSheetEmpty>
      )}
    </ActionSheetShell>
  );
}
