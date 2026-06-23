"use client";

/**
 * Manual test plan:
 * 1. Agent → Actions → Suggested messages → enable, add 2 static starters, save.
 * 2. Public widget: chips before first message; tap sends a message.
 * 3. keep showing OFF: static hidden after first message; dynamic ON shows new chips after bot reply.
 * 4. keep showing ON: static remains with dynamic when both apply.
 * 5. Disable action: no chips on widget or help page.
 * 6. Help page with empty action starters uses help deploy fallback.
 * 7. Owner preview and public widget token still return suggestedMessages when enabled.
 */

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ChatWidgetSuggestedMessages } from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSuggestedMessages";
import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import { updateSuggestedMessagesActionSettings } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

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
        toast.error(result.error ?? "Save failed");
        return;
      }
      const next = buildSuggestedMessagesActionDraft(result.data);
      setSavedDraft(next);
      setDraft(next);
      router.refresh();
      toast.success("Suggested messages saved");
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col border-hairline bg-surface-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-title-md font-normal tracking-tight text-ink">
            Suggested messages
          </SheetTitle>
          <SheetDescription className="text-body-sm text-muted">
            Show quick-reply chips in chat. Static starters appear before the first
            message; dynamic suggestions refresh after each bot reply when enabled.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-strong px-3 py-2.5">
            <Label htmlFor="suggested-messages-enabled" className="text-body-sm text-ink">
              Enable suggested messages
            </Label>
            <Switch
              id="suggested-messages-enabled"
              checked={draft.enabled}
              onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
            />
          </div>

          {draft.enabled ? (
            <>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-strong px-3 py-2.5">
                <Label
                  htmlFor="suggested-messages-dynamic"
                  className="text-body-sm text-ink"
                >
                  Dynamically suggest based on conversation
                </Label>
                <Switch
                  id="suggested-messages-dynamic"
                  checked={draft.dynamicEnabled}
                  onCheckedChange={(dynamicEnabled) =>
                    setDraft((d) => ({ ...d, dynamicEnabled }))
                  }
                />
              </div>

              <ChatWidgetSuggestedMessages
                messages={draft.staticStarters}
                keepShowing={draft.keepShowingAfterFirst}
                onMessagesChange={(staticStarters) =>
                  setDraft((d) => ({ ...d, staticStarters }))
                }
                onKeepShowingChange={(keepShowingAfterFirst) =>
                  setDraft((d) => ({ ...d, keepShowingAfterFirst }))
                }
              />
            </>
          ) : (
            <p className="py-8 text-center text-body-sm text-muted-soft">
              Turn on to configure starter chips and dynamic suggestions.
            </p>
          )}
        </div>

        <SheetFooter className="gap-2 border-t border-hairline pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-hairline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary text-on-primary hover:bg-primary-active"
            onClick={handleSave}
            disabled={pending || !isDirty}
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
