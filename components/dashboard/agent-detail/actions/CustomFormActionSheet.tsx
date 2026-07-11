"use client";

import { useEffect, useState, useTransition } from "react";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import {
  listFormSubmissions,
  updateCustomFormActionSettings,
  type FormSubmissionListItem,
} from "@/lib/actions/agents";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { CustomFormFieldsEditor } from "./CustomFormFieldsEditor";
import { CustomFormPreview } from "./CustomFormPreview";
import {
  ActionSheetEmpty,
  ActionSheetEnableRow,
  ActionSheetField,
  ActionSheetList,
  ActionSheetListItem,
  ActionSheetSection,
  ActionSheetSettingsGroup,
  ActionSheetShell,
  ActionSheetToggleRow,
  actionSheetInputClass,
  actionSheetTextareaClass,
} from "./ActionSheetShell";
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
  const t = useTranslations("dashboard.actions");
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
      toast.error(t(`validation.${err}`));
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
        notifyEmail: draft.notifyEmail.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.error ?? t("sheet.saveFailed"));
        return;
      }
      const next = buildCustomFormActionDraft(result.data);
      setSavedDraft(next);
      setDraft(next);
      router.refresh();
      toast.success(t("sheet.customForm.saved"));
      onOpenChange(false);
    });
  }

  return (
    <ActionSheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("catalog.customForm.title")}
      description={t("sheet.customForm.description")}
      size="wide"
      pending={pending}
      isDirty={isDirty}
      saveDisabled={Boolean(validationError)}
      onSave={handleSave}
    >
      <ActionSheetEnableRow label={t("sheet.customForm.enable")}>
        <Switch
          id="custom-form-enabled"
          checked={draft.enabled}
          onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
        />
      </ActionSheetEnableRow>

      {draft.enabled ? (
        <>
          <ActionSheetField label={t("sheet.customForm.formTitle")}>
            <Input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className={actionSheetInputClass}
            />
          </ActionSheetField>

          <ActionSheetField label={t("sheet.customForm.descriptionLabel")} description={t("sheet.customForm.descriptionHelp")}>
            <Textarea
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              rows={2}
              className={cn(actionSheetTextareaClass, "min-h-[56px]")}
            />
          </ActionSheetField>

          <ActionSheetField label={t("sheet.customForm.submitLabel")}>
            <Input
              value={draft.submitLabel}
              onChange={(e) =>
                setDraft((d) => ({ ...d, submitLabel: e.target.value }))
              }
              className={actionSheetInputClass}
            />
          </ActionSheetField>

          <ActionSheetSection
            title={t("sheet.customForm.whenToShow")}
            description={t("sheet.customForm.whenToShowDescription")}
          >
            <ActionSheetSettingsGroup>
              <div className="flex items-center gap-3 py-2.5">
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
                  placeholder={t("sheet.customForm.off")}
                  className={cn(actionSheetInputClass, "w-24")}
                />
                <span className="text-body-sm text-muted">
                  {t("sheet.customForm.userMessages")}
                </span>
              </div>

              <ActionSheetToggleRow label={t("sheet.customForm.allowAi")}>
                <Switch
                  id="allow-llm-form"
                  checked={draft.allowLlmTrigger}
                  onCheckedChange={(allowLlmTrigger) =>
                    setDraft((d) => ({ ...d, allowLlmTrigger }))
                  }
                />
              </ActionSheetToggleRow>
            </ActionSheetSettingsGroup>
          </ActionSheetSection>

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

          <ActionSheetField
            label={t("sheet.customForm.notifyEmail")}
            description={t("sheet.customForm.notifyEmailDescription")}
          >
            <Input
              id="custom-form-notify"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={draft.notifyEmail}
              onChange={(e) =>
                setDraft((d) => ({ ...d, notifyEmail: e.target.value }))
              }
              className={actionSheetInputClass}
            />
          </ActionSheetField>

          <ActionSheetSection title={t("sheet.customForm.recentSubmissions")}>
            <div className="mb-2 flex justify-end">
              <Link
                href={`/dashboard/leads?agentId=${agent.id}&captureType=custom_form`}
                className="text-caption text-muted hover:text-ink"
              >
                {t("sheet.customForm.viewAll")}
              </Link>
            </div>
            {submissionsLoading ? (
              <ActionSheetEmpty>{t("sheet.customForm.loading")}</ActionSheetEmpty>
            ) : submissions.length === 0 ? (
              <ActionSheetEmpty>{t("sheet.customForm.noSubmissions")}</ActionSheetEmpty>
            ) : (
              <ActionSheetList>
                {submissions.map((row) => (
                  <ActionSheetListItem key={row.id}>
                    <span className="text-caption text-muted">
                      {new Date(row.createdAt).toLocaleString()}
                    </span>
                    <span className="line-clamp-2 text-body-sm text-ink">
                      {formatSubmissionValues(row.values)}
                    </span>
                  </ActionSheetListItem>
                ))}
              </ActionSheetList>
            )}
          </ActionSheetSection>
        </>
      ) : (
        <ActionSheetEmpty>{t("sheet.customForm.disabledDescription")}</ActionSheetEmpty>
      )}
    </ActionSheetShell>
  );
}
