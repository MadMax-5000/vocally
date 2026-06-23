"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import { updateCustomButtonActionSettings } from "@/lib/actions/agents";
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

import { CustomButtonsEditor } from "./CustomButtonsEditor";
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col border-hairline bg-surface-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-title-md font-normal tracking-tight text-ink">
            Custom button
          </SheetTitle>
          <SheetDescription className="text-body-sm text-muted">
            Add quick-action buttons above the chat input. Use links for external pages or
            preset messages to start a conversation topic.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-strong px-3 py-2.5">
            <Label htmlFor="custom-button-enabled" className="text-body-sm text-ink">
              Enable custom buttons
            </Label>
            <Switch
              id="custom-button-enabled"
              checked={draft.enabled}
              onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
            />
          </div>

          {draft.enabled ? (
            <CustomButtonsEditor
              buttons={draft.buttons}
              onChange={(buttons) => setDraft((d) => ({ ...d, buttons }))}
            />
          ) : (
            <p className="py-8 text-center text-body-sm text-muted-soft">
              Turn on to add buttons above the chat composer.
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
            disabled={pending || !isDirty || Boolean(validationError)}
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
