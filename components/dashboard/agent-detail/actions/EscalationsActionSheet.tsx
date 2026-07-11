"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import { updateEscalationActionSettings } from "@/lib/actions/agents";
import { DEFAULT_ESCALATION_CUSTOMER_MESSAGE } from "@/lib/deploy/escalation-action";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  ActionSheetSection,
  ActionSheetSettingsGroup,
  ActionSheetShell,
  ActionSheetToggleRow,
  actionSheetInputClass,
  actionSheetTextareaClass,
} from "./ActionSheetShell";
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

const checkboxLabelClass =
  "cursor-pointer font-normal normal-case tracking-normal text-body-sm leading-snug text-ink";

export function EscalationsActionSheet({
  agent,
  open,
  onOpenChange,
}: EscalationsActionSheetProps) {
  const t = useTranslations("dashboard.actions");
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
        toast.error(result.error ?? t("sheet.saveFailed"));
        return;
      }
      const next = buildEscalationsActionDraft(result.data);
      setSavedDraft(next);
      setDraft(next);
      router.refresh();
      toast.success(t("sheet.escalations.saved"));
      onOpenChange(false);
    });
  }

  return (
    <ActionSheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("catalog.escalations.title")}
      description={t("sheet.escalations.description")}
      pending={pending}
      isDirty={isDirty}
      onSave={handleSave}
    >
      <ActionSheetEnableRow label={t("sheet.escalations.enable")}>
        <Switch
          id="escalations-enabled"
          checked={draft.enabled}
          onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
        />
      </ActionSheetEnableRow>

      {draft.enabled ? (
        <>
          <ActionSheetSection
            title={t("sheet.escalations.triggers")}
            description={t("sheet.escalations.triggersDescription")}
          >
            <ul className="flex flex-col gap-2">
              {TRIGGER_FIELD_MAP.map(({ key, labelKey }) => (
                <li
                  key={key}
                  className="flex items-start gap-2.5 rounded-md border border-hairline bg-surface-card px-3 py-2.5"
                >
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
                  <Label htmlFor={`trigger-${key}`} className={checkboxLabelClass}>
                    {t(`sheet.escalations.${labelKey}`)}
                  </Label>
                </li>
              ))}
            </ul>
          </ActionSheetSection>

          <ActionSheetField
            label={t("sheet.escalations.customerMessage")}
            description={t("sheet.escalations.customerMessageDescription")}
          >
            <Textarea
              id="escalation-customer-message"
              value={draft.customerMessage}
              onChange={(e) =>
                setDraft((d) => ({ ...d, customerMessage: e.target.value }))
              }
              placeholder={DEFAULT_ESCALATION_CUSTOMER_MESSAGE}
              rows={3}
              className={cn(actionSheetTextareaClass, "min-h-[72px] resize-none")}
            />
          </ActionSheetField>

          <ActionSheetSection
            title={t("sheet.escalations.tickets")}
            description={t("sheet.escalations.ticketsDescription")}
          >
            <ActionSheetSettingsGroup>
              <ActionSheetToggleRow label={t("sheet.escalations.createTicket")}>
                <Switch
                  id="create-ticket-on-escalate"
                  checked={draft.createTicketOnEscalate}
                  onCheckedChange={(createTicketOnEscalate) =>
                    setDraft((d) => ({ ...d, createTicketOnEscalate }))
                  }
                />
              </ActionSheetToggleRow>

              <ActionSheetToggleRow label={t("sheet.escalations.allowTicketTool")}>
                <Switch
                  id="allow-create-ticket-tool"
                  checked={draft.allowCreateTicketTool}
                  onCheckedChange={(allowCreateTicketTool) =>
                    setDraft((d) => ({ ...d, allowCreateTicketTool }))
                  }
                />
              </ActionSheetToggleRow>

              <ActionSheetToggleRow
                label={t("sheet.escalations.requireEmail")}
                description={t("sheet.escalations.requireEmailDescription")}
              >
                <Switch
                  id="require-email-ticket"
                  checked={draft.requireEmailForTicket}
                  onCheckedChange={(requireEmailForTicket) =>
                    setDraft((d) => ({ ...d, requireEmailForTicket }))
                  }
                />
              </ActionSheetToggleRow>
            </ActionSheetSettingsGroup>

            <ActionSheetField label={t("sheet.escalations.priority")} className="mt-3">
              <Select
                value={draft.ticketPriority}
                onValueChange={(ticketPriority) =>
                  setDraft((d) => ({
                    ...d,
                    ticketPriority: ticketPriority as EscalationsActionDraft["ticketPriority"],
                  }))
                }
              >
                <SelectTrigger className={actionSheetInputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`sheet.escalations.${value.toLowerCase()}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ActionSheetField>
          </ActionSheetSection>
        </>
      ) : (
        <ActionSheetEmpty>
          {t("sheet.escalations.disabledDescription")}
        </ActionSheetEmpty>
      )}
    </ActionSheetShell>
  );
}
