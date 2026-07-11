"use client";

/**
 * Manual test plan:
 * 1. Agent → Actions → Suggested messages → enable, add 2 static starters, save.
 * 2. Public widget: chips before first message; tap sends a message.
 * 3. keep showing OFF: static hidden after first message; dynamic ON shows new chips after bot reply.
 * 4. keep showing ON: static remains with dynamic when both apply.
 * 5. Disable action: no chips on widget or help page.
 * 6. Owner preview and public widget token still return suggestedMessages when enabled.
 */

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { ChatWidgetSuggestedMessages } from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSuggestedMessages";
import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import { updateSuggestedMessagesActionSettings } from "@/lib/actions/agents";
import { Switch } from "@/components/ui/switch";

import {
  ActionSheetEmpty,
  ActionSheetEnableRow,
  ActionSheetSection,
  ActionSheetShell,
  ActionSheetToggleRow,
} from "./ActionSheetShell";
import {
  buildSuggestedMessagesActionDraft,
  draftsEqual,
  type SuggestedMessagesActionDraft,
} from "./suggested-messages-action-draft";

type SuggestedMessagesActionSheetProps = {
  agent: AgentDetailWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SuggestedMessagesActionSheet({
  agent,
  open,
  onOpenChange,
}: SuggestedMessagesActionSheetProps) {
  const t = useTranslations("dashboard.actions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedDraft, setSavedDraft] = useState<SuggestedMessagesActionDraft>(() =>
    buildSuggestedMessagesActionDraft(agent),
  );
  const [draft, setDraft] = useState<SuggestedMessagesActionDraft>(() =>
    buildSuggestedMessagesActionDraft(agent),
  );

  useEffect(() => {
    if (!open) return;
    const next = buildSuggestedMessagesActionDraft(agent);
    setSavedDraft(next);
    setDraft(next);
  }, [agent, open]);

  const isDirty = !draftsEqual(draft, savedDraft);

  function handleSave() {
    startTransition(async () => {
      const result = await updateSuggestedMessagesActionSettings(agent.id, {
        enabled: draft.enabled,
        staticStarters: draft.staticStarters,
        keepShowingAfterFirst: draft.keepShowingAfterFirst,
        dynamicEnabled: draft.dynamicEnabled,
      });
      if (!result.success) {
        toast.error(result.error ?? t("sheet.saveFailed"));
        return;
      }
      const next = buildSuggestedMessagesActionDraft(result.data);
      setSavedDraft(next);
      setDraft(next);
      router.refresh();
      toast.success(t("sheet.suggestedMessages.saved"));
      onOpenChange(false);
    });
  }

  return (
    <ActionSheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("catalog.suggestedMessages.title")}
      description={t("sheet.suggestedMessages.description")}
      pending={pending}
      isDirty={isDirty}
      onSave={handleSave}
    >
      <ActionSheetEnableRow label={t("sheet.suggestedMessages.enable")}>
        <Switch
          id="suggested-messages-enabled"
          checked={draft.enabled}
          onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
        />
      </ActionSheetEnableRow>

      {draft.enabled ? (
        <>
          <ActionSheetToggleRow label={t("sheet.suggestedMessages.dynamic")}>
            <Switch
              id="suggested-messages-dynamic"
              checked={draft.dynamicEnabled}
              onCheckedChange={(dynamicEnabled) =>
                setDraft((d) => ({ ...d, dynamicEnabled }))
              }
            />
          </ActionSheetToggleRow>

          <ActionSheetSection
            title={t("sheet.suggestedMessages.starterMessages")}
            description={t("sheet.suggestedMessages.starterMessagesDescription")}
          >
            <ChatWidgetSuggestedMessages
              messages={draft.staticStarters}
              keepShowing={draft.keepShowingAfterFirst}
              onMessagesChange={(staticStarters) =>
                setDraft((d) => ({ ...d, staticStarters }))
              }
              onKeepShowingChange={(keepShowingAfterFirst) =>
                setDraft((d) => ({ ...d, keepShowingAfterFirst }))
              }
              variant="action-sheet"
            />
          </ActionSheetSection>
        </>
      ) : (
        <ActionSheetEmpty>
          {t("sheet.suggestedMessages.disabledDescription")}
        </ActionSheetEmpty>
      )}
    </ActionSheetShell>
  );
}
