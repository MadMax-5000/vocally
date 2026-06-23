"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import {
  listFormSubmissions,
  updateCustomFormActionSettings,
  type FormSubmissionListItem,
} from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

import { chatWidgetFieldInputClass } from "../deploy/chat-widget/ChatWidgetSettingRow";
import { CustomFormFieldsEditor } from "./CustomFormFieldsEditor";
import { CustomFormPreview } from "./CustomFormPreview";
import {
  buildCustomFormActionDraft,
  draftsEqual,
  validateCustomFormDraft,
  type CustomFormActionDraft,
} from "./custom-form-action-draft";

type CustomFormActionSheetProps = {
  agent: AgentDetailWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatSubmissionValues(values: Record<string, string>): string {
  const entries = Object.entries(values).filter(([, v]) => v?.trim());
  if (entries.length === 0) return "—";
  return entries.map(([, v]) => v).join(" · ");
}

export function CustomFormActionSheet({
  agent,
  open,
  onOpenChange,
}: CustomFormActionSheetProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedDraft, setSavedDraft] = useState<CustomFormActionDraft>(() =>
    buildCustomFormActionDraft(agent),
  );
  const [draft, setDraft] = useState<CustomFormActionDraft>(() =>
    buildCustomFormActionDraft(agent),
  );
  const [submissions, setSubmissions] = useState<FormSubmissionListItem[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = buildCustomFormActionDraft(agent);
    setSavedDraft(next);
    setDraft(next);

    setSubmissionsLoading(true);
    void listFormSubmissions(agent.id, { limit: 20 }).then((result) => {
      setSubmissionsLoading(false);
      if (result.success) {
        setSubmissions(result.data);
      }
    });
  }, [agent, open]);

  const isDirty = !draftsEqual(draft, savedDraft);
  const validationError = validateCustomFormDraft(draft);

  function handleSave() {
    const err = validateCustomFormDraft(draft);
    if (err) {
      toast.error(err);
      return;
    }

    startTransition(async () => {
      const result = await updateCustomFormActionSettings(agent.id, {
        enabled: draft.enabled,
        formId: draft.formId,
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        submitLabel: draft.submitLabel.trim(),
        fields: draft.enabled
          ? draft.fields
              .filter((f) => f.label.trim())
              .map((f) => ({
                id: f.id,
                type: f.type,
                label: f.label.trim(),
                required: f.required,
                ...(f.placeholder?.trim()
                  ? { placeholder: f.placeholder.trim() }
                  : {}),
                ...(f.type === "select" && f.options?.length
                  ? { options: f.options }
                  : {}),
              }))
          : undefined,
        showAfterUserMessages: draft.showAfterUserMessages,
        allowLlmTrigger: draft.allowLlmTrigger,
      });
      if (!result.success) {
        toast.error(result.error ?? "Save failed");
        return;
      }
      const next = buildCustomFormActionDraft(result.data);
      setSavedDraft(next);
      setDraft(next);
      router.refresh();
      toast.success("Custom form saved");
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col border-hairline bg-surface-card sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display text-title-md font-normal tracking-tight text-ink">
            Custom form
          </SheetTitle>
          <SheetDescription className="text-body-sm text-muted">
            Build a form customers fill in chat. Show it automatically after a number of
            messages or let the AI offer it with a tool.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-strong px-3 py-2.5">
            <Label htmlFor="custom-form-enabled" className="text-body-sm text-ink">
              Enable custom form
            </Label>
            <Switch
              id="custom-form-enabled"
              checked={draft.enabled}
              onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
            />
          </div>

          {draft.enabled ? (
            <>
              <div className="mt-4 space-y-3">
                <div>
                  <Label className="text-body-sm text-ink">Form title</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    className={cn(chatWidgetFieldInputClass, "mt-1")}
                  />
                </div>
                <div>
                  <Label className="text-body-sm text-ink">Description (optional)</Label>
                  <textarea
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, description: e.target.value }))
                    }
                    rows={2}
                    className={cn(
                      chatWidgetFieldInputClass,
                      "mt-1 w-full resize-y min-h-[56px]",
                    )}
                  />
                </div>
                <div>
                  <Label className="text-body-sm text-ink">Submit button label</Label>
                  <Input
                    value={draft.submitLabel}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, submitLabel: e.target.value }))
                    }
                    className={cn(chatWidgetFieldInputClass, "mt-1")}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-xl border border-hairline bg-surface-strong p-3">
                <Label className="text-body-sm text-ink">When to show</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={draft.showAfterUserMessages ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setDraft((d) => ({
                        ...d,
                        showAfterUserMessages: raw
                          ? Math.min(100, Math.max(1, parseInt(raw, 10) || 1))
                          : null,
                      }));
                    }}
                    placeholder="Off"
                    className={cn(chatWidgetFieldInputClass, "w-24")}
                  />
                  <span className="text-body-sm text-muted">
                    user messages (leave empty for AI-only)
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Label htmlFor="allow-llm-form" className="text-body-sm text-ink">
                    Allow AI to show form (tool)
                  </Label>
                  <Switch
                    id="allow-llm-form"
                    checked={draft.allowLlmTrigger}
                    onCheckedChange={(allowLlmTrigger) =>
                      setDraft((d) => ({ ...d, allowLlmTrigger }))
                    }
                  />
                </div>
              </div>

              <CustomFormFieldsEditor
                fields={draft.fields}
                onChange={(fields) => setDraft((d) => ({ ...d, fields }))}
              />

              <CustomFormPreview
                formId={draft.formId}
                title={draft.title}
                description={draft.description}
                submitLabel={draft.submitLabel}
                fields={draft.fields}
              />

              <div className="mt-6 border-t border-hairline pt-4">
                <h3 className="text-body-sm font-medium text-ink">Recent submissions</h3>
                {submissionsLoading ? (
                  <p className="mt-2 text-body-sm text-muted-soft">Loading…</p>
                ) : submissions.length === 0 ? (
                  <p className="mt-2 text-body-sm text-muted-soft">No submissions yet.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-hairline rounded-lg border border-hairline">
                    {submissions.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-col gap-0.5 px-3 py-2 text-body-sm"
                      >
                        <span className="text-caption text-muted">
                          {new Date(row.createdAt).toLocaleString()}
                        </span>
                        <span className="text-ink line-clamp-2">
                          {formatSubmissionValues(row.values)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-body-sm text-muted-soft">
              Turn on to configure a form for web chat.
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
