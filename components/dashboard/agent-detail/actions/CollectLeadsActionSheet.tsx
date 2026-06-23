"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import {
  listAgentLeads,
  updateCollectLeadsActionSettings,
  type AgentLeadListItem,
} from "@/lib/actions/agents";
import { LEAD_FIELD_KEYS, type LeadFieldKey } from "@/lib/deploy/collect-leads-action";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col border-hairline bg-surface-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-title-md font-normal tracking-tight text-ink">
            Collect leads
          </SheetTitle>
          <SheetDescription className="text-body-sm text-muted">
            Let the agent capture contact details in conversation and save them as
            structured leads.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-1">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-strong px-3 py-2.5">
            <Label htmlFor="collect-leads-enabled" className="text-body-sm text-ink">
              Enable collect leads
            </Label>
            <Switch
              id="collect-leads-enabled"
              checked={draft.enabled}
              onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
            />
          </div>

          {draft.enabled ? (
            <>
              <div className="space-y-2">
                <p className="text-body-sm font-medium text-ink">When to ask</p>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      { value: "proactive" as const, label: "Proactively" },
                      {
                        value: "intent_only" as const,
                        label: "Only when interested",
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, whenToAsk: opt.value }))
                      }
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left text-body-sm transition-colors",
                        draft.whenToAsk === opt.value
                          ? "border-hairline-strong bg-surface-strong text-ink"
                          : "border-hairline bg-surface-card text-muted hover:bg-canvas-soft",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-body-sm font-medium text-ink">Fields</p>
                <div className="space-y-2">
                  {LEAD_FIELD_KEYS.map((fieldKey) => (
                    <div
                      key={fieldKey}
                      className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-surface-strong px-3 py-2"
                    >
                      <span className="text-body-sm text-ink">
                        {FIELD_LABELS[fieldKey]}
                      </span>
                      <select
                        value={draft.fields[fieldKey]}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            fields: {
                              ...d.fields,
                              [fieldKey]: e.target.value as CollectLeadsActionDraft["fields"][LeadFieldKey],
                            },
                          }))
                        }
                        className="h-8 rounded-md border border-hairline bg-surface-card px-2 text-caption text-body"
                      >
                        <option value="required">Required</option>
                        <option value="optional">Optional</option>
                        <option value="off">Off</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="collect-leads-consent" className="text-body-sm text-ink">
                  Consent / disclaimer
                </Label>
                <Textarea
                  id="collect-leads-consent"
                  value={draft.consentText}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, consentText: e.target.value }))
                  }
                  rows={3}
                  className="resize-none border-hairline bg-surface-card text-body-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collect-leads-notify" className="text-body-sm text-ink">
                  Notify email (optional)
                </Label>
                <Input
                  id="collect-leads-notify"
                  type="email"
                  placeholder="team@company.com"
                  value={draft.notifyEmail}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, notifyEmail: e.target.value }))
                  }
                  className="border-hairline bg-surface-card text-body-sm"
                />
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-body-sm text-muted-soft">
              Turn on to configure how the agent collects contact details.
            </p>
          )}

          <div className="space-y-2 border-t border-hairline pt-4">
            <p className="text-body-sm font-medium text-ink">Recent leads</p>
            {leadsLoading ? (
              <p className="text-body-sm text-muted-soft">Loading…</p>
            ) : recentLeads.length === 0 ? (
              <p className="text-body-sm text-muted-soft">
                No leads captured yet for this agent.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentLeads.map((lead) => (
                  <li
                    key={lead.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-surface-strong px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-body-sm text-ink">
                        {formatLeadLabel(lead)}
                      </p>
                      <p className="text-caption text-muted-soft">
                        {lead.source} · {formatRelativeTime(lead.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
