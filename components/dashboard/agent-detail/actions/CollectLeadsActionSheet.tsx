"use client";

import { useEffect, useState, useTransition } from "react";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import {
  listAgentLeads,
  updateCollectLeadsActionSettings,
  type AgentLeadListItem,
} from "@/lib/actions/agents";
import { LEAD_FIELD_KEYS, type LeadFieldKey } from "@/lib/deploy/collect-leads-action";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  ActionSheetEmpty,
  ActionSheetEnableRow,
  ActionSheetField,
  ActionSheetList,
  ActionSheetListItem,
  ActionSheetSection,
  ActionSheetShell,
  actionSheetInputClass,
  actionSheetTextareaClass,
} from "./ActionSheetShell";
import {
  buildCollectLeadsActionDraft,
  draftsEqual,
  type CollectLeadsActionDraft,
} from "./collect-leads-action-draft";

type CollectLeadsActionSheetProps = {
  agent: AgentDetailWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatLeadLabel(lead: AgentLeadListItem, unknown: string): string {
  if (lead.name?.trim()) return lead.name.trim();
  if (lead.email?.trim()) return lead.email.trim();
  if (lead.phone?.trim()) return lead.phone.trim();
  if (lead.company?.trim()) return lead.company.trim();
  return unknown;
}

function formatRelativeTime(iso: string, t: ReturnType<typeof useTranslations>): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t("sheet.justNow");
  if (diffMin < 60) return t("sheet.minutesAgo", { count: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t("sheet.hoursAgo", { count: diffHr });
  const diffDay = Math.floor(diffHr / 24);
  return t("sheet.daysAgo", { count: diffDay });
}

export function CollectLeadsActionSheet({
  agent,
  open,
  onOpenChange,
}: CollectLeadsActionSheetProps) {
  const t = useTranslations("dashboard.actions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [recentLeads, setRecentLeads] = useState<AgentLeadListItem[]>([]);
  const [savedDraft, setSavedDraft] = useState<CollectLeadsActionDraft>(() =>
    buildCollectLeadsActionDraft(agent),
  );
  const [draft, setDraft] = useState<CollectLeadsActionDraft>(() =>
    buildCollectLeadsActionDraft(agent),
  );

  useEffect(() => {
    if (!open) return;
    const next = buildCollectLeadsActionDraft(agent);
    setSavedDraft(next);
    setDraft(next);

    setLeadsLoading(true);
    void listAgentLeads(agent.id, { limit: 20 }).then((result) => {
      setLeadsLoading(false);
      if (result.success) {
        setRecentLeads(result.data);
      }
    });
  }, [agent, open]);

  const isDirty = !draftsEqual(draft, savedDraft);

  function handleSave() {
    startTransition(async () => {
      const result = await updateCollectLeadsActionSettings(agent.id, {
        enabled: draft.enabled,
        whenToAsk: draft.whenToAsk,
        fields: draft.fields,
        consentText: draft.consentText,
        notifyEmail: draft.notifyEmail,
      });
      if (!result.success) {
        toast.error(result.error ?? t("sheet.saveFailed"));
        return;
      }
      const next = buildCollectLeadsActionDraft(result.data);
      setSavedDraft(next);
      setDraft(next);
      router.refresh();
      toast.success(t("sheet.collectLeads.saved"));
      onOpenChange(false);
    });
  }

  return (
    <ActionSheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("catalog.collectLeads.title")}
      description={t("sheet.collectLeads.description")}
      pending={pending}
      isDirty={isDirty}
      onSave={handleSave}
    >
      <ActionSheetEnableRow label={t("sheet.collectLeads.enable")}>
        <Switch
          id="collect-leads-enabled"
          checked={draft.enabled}
          onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
        />
      </ActionSheetEnableRow>

      {draft.enabled ? (
        <>
          <ActionSheetSection
            title={t("sheet.collectLeads.whenToAsk")}
            description={t("sheet.collectLeads.whenToAskDescription")}
          >
            <RadioGroup
              value={draft.whenToAsk}
              onValueChange={(whenToAsk) =>
                setDraft((d) => ({
                  ...d,
                  whenToAsk: whenToAsk as CollectLeadsActionDraft["whenToAsk"],
                }))
              }
              className="flex flex-col gap-2"
            >
              {(["proactive", "intent_only"] as const).map((value) => (
                <label
                  key={value}
                  htmlFor={`when-to-ask-${value}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 transition-colors",
                    draft.whenToAsk === value
                      ? "border-hairline-strong bg-surface-card"
                      : "border-hairline bg-surface-card hover:bg-canvas-soft",
                  )}
                >
                  <RadioGroupItem value={value} id={`when-to-ask-${value}`} />
                  <span className="text-body-sm text-ink">
                    {t(`sheet.collectLeads.${value === "proactive" ? "proactively" : "whenInterested"}`)}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </ActionSheetSection>

          <ActionSheetSection title={t("sheet.collectLeads.fields")}>
            <ActionSheetList>
              {LEAD_FIELD_KEYS.map((fieldKey) => (
                <ActionSheetListItem key={fieldKey}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-body-sm text-ink">{t(`sheet.collectLeads.${fieldKey}`)}</span>
                    <Select
                      value={draft.fields[fieldKey]}
                      onValueChange={(value) =>
                        setDraft((d) => ({
                          ...d,
                          fields: {
                            ...d.fields,
                            [fieldKey]:
                              value as CollectLeadsActionDraft["fields"][LeadFieldKey],
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 w-[112px] rounded-md border-hairline bg-surface-card text-body-sm shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">{t("sheet.collectLeads.required")}</SelectItem>
                        <SelectItem value="optional">{t("sheet.collectLeads.optional")}</SelectItem>
                        <SelectItem value="off">{t("sheet.collectLeads.off")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </ActionSheetListItem>
              ))}
            </ActionSheetList>
          </ActionSheetSection>

          <ActionSheetField label={t("sheet.collectLeads.consent")}>
            <Textarea
              id="collect-leads-consent"
              value={draft.consentText}
              onChange={(e) =>
                setDraft((d) => ({ ...d, consentText: e.target.value }))
              }
              rows={3}
              className={cn(actionSheetTextareaClass, "min-h-[72px] resize-none")}
            />
          </ActionSheetField>

          <ActionSheetField label={t("sheet.collectLeads.notifyEmail")} description={t("sheet.collectLeads.notifyEmailDescription")}>
            <Input
              id="collect-leads-notify"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={draft.notifyEmail}
              onChange={(e) =>
                setDraft((d) => ({ ...d, notifyEmail: e.target.value }))
              }
              className={actionSheetInputClass}
            />
          </ActionSheetField>
        </>
      ) : (
        <ActionSheetEmpty>{t("sheet.collectLeads.disabledDescription")}</ActionSheetEmpty>
      )}

      <ActionSheetSection title={t("sheet.collectLeads.recentLeads")}>
        <div className="mb-2 flex justify-end">
          <Link
            href={`/dashboard/leads?agentId=${agent.id}`}
            className="text-caption text-muted hover:text-ink"
          >
            {t("sheet.collectLeads.viewAll")}
          </Link>
        </div>
        {leadsLoading ? (
          <ActionSheetEmpty>{t("sheet.collectLeads.loading")}</ActionSheetEmpty>
        ) : recentLeads.length === 0 ? (
          <ActionSheetEmpty>{t("sheet.collectLeads.noLeads")}</ActionSheetEmpty>
        ) : (
          <ActionSheetList>
            {recentLeads.map((lead) => (
              <ActionSheetListItem key={lead.id}>
                <p className="truncate text-body-sm text-ink">{formatLeadLabel(lead, t("sheet.unknown"))}</p>
                <p className="text-caption text-muted-soft">
                  {lead.source} · {formatRelativeTime(lead.createdAt, t)}
                </p>
              </ActionSheetListItem>
            ))}
          </ActionSheetList>
        )}
      </ActionSheetSection>
    </ActionSheetShell>
  );
}
