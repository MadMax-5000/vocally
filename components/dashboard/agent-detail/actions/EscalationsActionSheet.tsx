"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import { updateEscalationActionSettings } from "@/lib/actions/agents";
import { DEFAULT_ESCALATION_CUSTOMER_MESSAGE } from "@/lib/deploy/escalation-action";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import {
  buildEscalationsActionDraft,
  draftsEqual,
  TRIGGER_FIELD_MAP,
  type EscalationsActionDraft,
} from "./escalations-action-draft";

type EscalationsActionSheetProps = {
  agent: AgentDetailWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

export function EscalationsActionSheet({
  agent,
  open,
  onOpenChange,
}: EscalationsActionSheetProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedDraft, setSavedDraft] = useState<EscalationsActionDraft>(() =>
    buildEscalationsActionDraft(agent),
  );
  const [draft, setDraft] = useState<EscalationsActionDraft>(() =>
    buildEscalationsActionDraft(agent),
  );

  useEffect(() => {
    if (!open) return;
    const next = buildEscalationsActionDraft(agent);
    setSavedDraft(next);
    setDraft(next);
  }, [agent, open]);

  const isDirty = !draftsEqual(draft, savedDraft);

  function handleSave() {
    startTransition(async () => {
      const result = await updateEscalationActionSettings(agent.id, {
        enabled: draft.enabled,
        triggers: draft.triggers,
        customerMessage: draft.customerMessage,
        createTicketOnEscalate: draft.createTicketOnEscalate,
        allowCreateTicketTool: draft.allowCreateTicketTool,
        ticketPriority: draft.ticketPriority,
        requireEmailForTicket: draft.requireEmailForTicket,
      });
      if (!result.success) {
        toast.error(result.error ?? "Save failed");
        return;
      }
      const next = buildEscalationsActionDraft(result.data);
      setSavedDraft(next);
      setDraft(next);
      router.refresh();
      toast.success("Escalations saved");
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col border-hairline bg-surface-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-title-md font-normal tracking-tight text-ink">
            Escalations
          </SheetTitle>
          <SheetDescription className="text-body-sm text-muted">
            Hand conversations to your team when customers need a human. Tickets
            are stored in Vocally for your inbox.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-1">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-strong px-3 py-2.5">
            <Label htmlFor="escalations-enabled" className="text-body-sm text-ink">
              Enable handoff to human agents
            </Label>
            <Switch
              id="escalations-enabled"
              checked={draft.enabled}
              onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
            />
          </div>

          {draft.enabled ? (
            <>
              <div className="space-y-2">
                <p className="text-body-sm font-medium text-ink">Escalation triggers</p>
                <ul className="space-y-2 rounded-xl border border-hairline bg-surface-strong px-3 py-2.5">
                  {TRIGGER_FIELD_MAP.map(({ key, label }) => (
                    <li key={key} className="flex items-start gap-2.5">
                      <Checkbox
                        id={`trigger-${key}`}
                        checked={draft.triggers[key]}
                        onCheckedChange={(checked) =>
                          setDraft((d) => ({
                            ...d,
                            triggers: { ...d.triggers, [key]: checked === true },
                          }))
                        }
                      />
                      <Label
                        htmlFor={`trigger-${key}`}
                        className="cursor-pointer text-body-sm leading-snug text-ink"
                      >
                        {label}
                      </Label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="escalation-customer-message" className="text-body-sm text-ink">
                  Customer message (optional)
                </Label>
                <Textarea
                  id="escalation-customer-message"
                  value={draft.customerMessage}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, customerMessage: e.target.value }))
                  }
                  placeholder={DEFAULT_ESCALATION_CUSTOMER_MESSAGE}
                  rows={3}
                  className="resize-none border-hairline bg-surface-card text-body-sm"
                />
                <p className="text-caption text-muted-soft">
                  Shown in chat when a conversation is escalated.
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-hairline bg-surface-strong px-3 py-2.5">
                <p className="text-body-sm font-medium text-ink">Vocally tickets</p>

                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="create-ticket-on-escalate"
                    className="text-body-sm text-ink"
                  >
                    Create ticket automatically on escalate
                  </Label>
                  <Switch
                    id="create-ticket-on-escalate"
                    checked={draft.createTicketOnEscalate}
                    onCheckedChange={(createTicketOnEscalate) =>
                      setDraft((d) => ({ ...d, createTicketOnEscalate }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="allow-create-ticket-tool" className="text-body-sm text-ink">
                    Let the bot use create_ticket during chat
                  </Label>
                  <Switch
                    id="allow-create-ticket-tool"
                    checked={draft.allowCreateTicketTool}
                    onCheckedChange={(allowCreateTicketTool) =>
                      setDraft((d) => ({ ...d, allowCreateTicketTool }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-body-sm text-ink">Default ticket priority</Label>
                  <Select
                    value={draft.ticketPriority}
                    onValueChange={(ticketPriority) =>
                      setDraft((d) => ({
                        ...d,
                        ticketPriority: ticketPriority as EscalationsActionDraft["ticketPriority"],
                      }))
                    }
                  >
                    <SelectTrigger className="border-hairline bg-surface-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="require-email-ticket" className="text-body-sm text-ink">
                    Require customer email for auto-ticket
                  </Label>
                  <Switch
                    id="require-email-ticket"
                    checked={draft.requireEmailForTicket}
                    onCheckedChange={(requireEmailForTicket) =>
                      setDraft((d) => ({ ...d, requireEmailForTicket }))
                    }
                  />
                </div>
                <p className="text-caption text-muted-soft">
                  Auto-tickets are skipped when no email appears in the conversation.
                </p>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-body-sm text-muted-soft">
              Turn on to configure when conversations escalate and how tickets are
              created.
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
