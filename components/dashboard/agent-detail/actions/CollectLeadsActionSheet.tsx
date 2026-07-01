"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

const FIELD_LABELS: Record<LeadFieldKey, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  company: "Company",
  notes: "Notes",
};

const WHEN_TO_ASK_OPTIONS = [
  { value: "proactive" as const, label: "Proactively" },
  { value: "intent_only" as const, label: "Only when interested" },
] as const;

type CollectLeadsActionSheetProps = {
  agent: AgentDetailWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatLeadLabel(lead: AgentLeadListItem): string {
  if (lead.name?.trim()) return lead.name.trim();
  if (lead.email?.trim()) return lead.email.trim();
  if (lead.phone?.trim()) return lead.phone.trim();
  if (lead.company?.trim()) return lead.company.trim();
  return "Unknown";
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function CollectLeadsActionSheet({
  agent,
  open,
  onOpenChange,
}: CollectLeadsActionSheetProps) {
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
        toast.error(result.error ?? "Save failed");
        return;
      }
      const next = buildCollectLeadsActionDraft(result.data);
      setSavedDraft(next);
      setDraft(next);
      router.refresh();
      toast.success("Collect leads saved");
      onOpenChange(false);
    });
  }

  return (
    <ActionSheetShell
      open={open}
      onOpenChange={onOpenChange}
      title="Collect leads"
      description="Let the agent capture contact details in conversation and save them as structured leads. Conversational only — no inline form UI (unlike Custom form)."
      pending={pending}
      isDirty={isDirty}
      onSave={handleSave}
    >
      <ActionSheetEnableRow label="Enable collect leads">
        <Switch
          id="collect-leads-enabled"
          checked={draft.enabled}
          onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
        />
      </ActionSheetEnableRow>

      {draft.enabled ? (
        <>
          <ActionSheetSection
            title="When to ask"
            description="Choose when the agent should request contact details."
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
              {WHEN_TO_ASK_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`when-to-ask-${opt.value}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 transition-colors",
                    draft.whenToAsk === opt.value
                      ? "border-hairline-strong bg-surface-card"
                      : "border-hairline bg-surface-card hover:bg-canvas-soft",
                  )}
                >
                  <RadioGroupItem value={opt.value} id={`when-to-ask-${opt.value}`} />
                  <span className="text-body-sm text-ink">{opt.label}</span>
                </label>
              ))}
            </RadioGroup>
          </ActionSheetSection>

          <ActionSheetSection title="Fields">
            <ActionSheetList>
              {LEAD_FIELD_KEYS.map((fieldKey) => (
                <ActionSheetListItem key={fieldKey}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-body-sm text-ink">{FIELD_LABELS[fieldKey]}</span>
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
                        <SelectItem value="required">Required</SelectItem>
                        <SelectItem value="optional">Optional</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </ActionSheetListItem>
              ))}
            </ActionSheetList>
          </ActionSheetSection>

          <ActionSheetField label="Consent / disclaimer">
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

          <ActionSheetField label="Notify email" description="Optional — get an email when all required fields are captured.">
            <Input
              id="collect-leads-notify"
              type="email"
              placeholder="team@company.com"
              value={draft.notifyEmail}
              onChange={(e) =>
                setDraft((d) => ({ ...d, notifyEmail: e.target.value }))
              }
              className={actionSheetInputClass}
            />
          </ActionSheetField>
        </>
      ) : (
        <ActionSheetEmpty>Turn on to configure how the agent collects contact details.</ActionSheetEmpty>
      )}

      <ActionSheetSection title="Recent leads">
        <div className="mb-2 flex justify-end">
          <Link
            href={`/dashboard/leads?agentId=${agent.id}`}
            className="text-caption text-muted hover:text-ink"
          >
            View all in Leads
          </Link>
        </div>
        {leadsLoading ? (
          <ActionSheetEmpty>Loading…</ActionSheetEmpty>
        ) : recentLeads.length === 0 ? (
          <ActionSheetEmpty>No leads captured yet for this agent.</ActionSheetEmpty>
        ) : (
          <ActionSheetList>
            {recentLeads.map((lead) => (
              <ActionSheetListItem key={lead.id}>
                <p className="truncate text-body-sm text-ink">{formatLeadLabel(lead)}</p>
                <p className="text-caption text-muted-soft">
                  {lead.source} · {formatRelativeTime(lead.createdAt)}
                </p>
              </ActionSheetListItem>
            ))}
          </ActionSheetList>
        )}
      </ActionSheetSection>
    </ActionSheetShell>
  );
}
