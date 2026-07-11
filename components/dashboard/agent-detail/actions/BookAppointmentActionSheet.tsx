"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { AppIcon } from "@/components/ui/app-icon";
import { PlusIcon, Trash2Icon } from "@/lib/icons/app-icons";
import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import {
  listAgentAppointments,
  updateBookAppointmentActionSettings,
  type AgentAppointmentListItem,
} from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
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
} from "./ActionSheetShell";
import {
  buildBookAppointmentActionDraft,
  draftsEqual,
  validateBookAppointmentDraft,
  type BookAppointmentActionDraft,
} from "./book-appointment-action-draft";

const MAX_DEPARTMENTS = 12;

type BookAppointmentActionSheetProps = {
  agent: AgentDetailWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatAppointmentLabel(item: AgentAppointmentListItem, unknown: string): string {
  if (item.customerName?.trim()) return item.customerName.trim();
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

function formatAppointmentWhen(item: AgentAppointmentListItem): string {
  const date = item.date.slice(0, 10);
  return `${date} ${item.time} · ${item.department}`;
}

export function BookAppointmentActionSheet({
  agent,
  open,
  onOpenChange,
}: BookAppointmentActionSheetProps) {
  const t = useTranslations("dashboard.actions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [recentAppointments, setRecentAppointments] = useState<
    AgentAppointmentListItem[]
  >([]);
  const [savedDraft, setSavedDraft] = useState<BookAppointmentActionDraft>(() =>
    buildBookAppointmentActionDraft(agent),
  );
  const [draft, setDraft] = useState<BookAppointmentActionDraft>(() =>
    buildBookAppointmentActionDraft(agent),
  );
  const [newDepartment, setNewDepartment] = useState("");

  useEffect(() => {
    if (!open) return;
    const next = buildBookAppointmentActionDraft(agent);
    setSavedDraft(next);
    setDraft(next);
    setNewDepartment("");

    setAppointmentsLoading(true);
    void listAgentAppointments(agent.id, { limit: 20 }).then((result) => {
      setAppointmentsLoading(false);
      if (result.success) {
        setRecentAppointments(result.data);
      }
    });
  }, [agent, open]);

  const isDirty = !draftsEqual(draft, savedDraft);

  function addDepartment() {
    const label = newDepartment.trim().toLowerCase();
    if (!label) return;
    if (draft.departments.some((d) => d.toLowerCase() === label)) {
      toast.error(t("sheet.bookAppointment.departmentExists"));
      return;
    }
    if (draft.departments.length >= MAX_DEPARTMENTS) {
      toast.error(t("sheet.bookAppointment.maximumDepartments", { count: MAX_DEPARTMENTS }));
      return;
    }
    setDraft((d) => ({ ...d, departments: [...d.departments, label] }));
    setNewDepartment("");
  }

  function removeDepartment(index: number) {
    setDraft((d) => ({
      ...d,
      departments: d.departments.filter((_, i) => i !== index),
    }));
  }

  function handleSave() {
    const err = validateBookAppointmentDraft(draft);
    if (err) {
      toast.error(t(`validation.${err}`));
      return;
    }

    startTransition(async () => {
      const result = await updateBookAppointmentActionSettings(agent.id, {
        enabled: draft.enabled,
        whenToOffer: draft.whenToOffer,
        departments: draft.enabled
          ? draft.departments.map((d) => d.trim().toLowerCase()).filter(Boolean)
          : draft.departments,
        notifyEmail: draft.notifyEmail,
      });
      if (!result.success) {
        toast.error(result.error ?? t("sheet.saveFailed"));
        return;
      }
      const next = buildBookAppointmentActionDraft(result.data);
      setSavedDraft(next);
      setDraft(next);
      router.refresh();
      toast.success(t("sheet.bookAppointment.saved"));
      onOpenChange(false);
    });
  }

  return (
    <ActionSheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("catalog.bookAppointment.title")}
      description={t("sheet.bookAppointment.description")}
      pending={pending}
      isDirty={isDirty}
      onSave={handleSave}
    >
      <ActionSheetEnableRow label={t("sheet.bookAppointment.enable")}>
        <Switch
          id="book-appointment-enabled"
          checked={draft.enabled}
          onCheckedChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
        />
      </ActionSheetEnableRow>

      {draft.enabled ? (
        <>
          <ActionSheetSection
            title={t("sheet.bookAppointment.whenToOffer")}
            description={t("sheet.bookAppointment.whenToOfferDescription")}
          >
            <RadioGroup
              value={draft.whenToOffer}
              onValueChange={(whenToOffer) =>
                setDraft((d) => ({
                  ...d,
                  whenToOffer:
                    whenToOffer as BookAppointmentActionDraft["whenToOffer"],
                }))
              }
              className="flex flex-col gap-2"
            >
              {(["proactive", "intent_only"] as const).map((value) => (
                <label
                  key={value}
                  htmlFor={`when-to-offer-${value}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 transition-colors",
                    draft.whenToOffer === value
                      ? "border-hairline-strong bg-surface-card"
                      : "border-hairline bg-surface-card hover:bg-canvas-soft",
                  )}
                >
                  <RadioGroupItem
                    value={value}
                    id={`when-to-offer-${value}`}
                  />
                  <span className="text-body-sm text-ink">
                    {t(`sheet.bookAppointment.${value === "proactive" ? "proactively" : "whenAsked"}`)}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </ActionSheetSection>

          <ActionSheetSection
            title={t("sheet.bookAppointment.departments")}
            description={t("sheet.bookAppointment.departmentsDescription")}
          >
            {draft.departments.length === 0 ? (
              <p className="text-body-sm text-muted-soft">{t("sheet.bookAppointment.noDepartments")}</p>
            ) : (
              <ul className="mb-3 flex flex-col gap-2">
                {draft.departments.map((dept, index) => (
                  <li
                    key={`${dept}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-hairline bg-surface-card px-3 py-2"
                  >
                    <span className="text-body-sm text-ink">{dept}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0 text-muted hover:text-ink"
                      onClick={() => removeDepartment(index)}
                      aria-label={t("removeItem", { item: dept })}
                    >
                      <AppIcon icon={Trash2Icon} className="h-4 w-4" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input
                placeholder={t("sheet.bookAppointment.departmentPlaceholder")}
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDepartment();
                  }
                }}
                className={actionSheetInputClass}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1 border-hairline"
                onClick={addDepartment}
                disabled={draft.departments.length >= MAX_DEPARTMENTS}
              >
                <AppIcon icon={PlusIcon} className="h-4 w-4" aria-hidden />
                {t("sheet.bookAppointment.addDepartment")}
              </Button>
            </div>
          </ActionSheetSection>

          <ActionSheetField
            label={t("sheet.bookAppointment.notifyEmail")}
            description={t("sheet.bookAppointment.notifyEmailDescription")}
          >
            <Input
              id="book-appointment-notify"
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
        <ActionSheetEmpty>
          {t("sheet.bookAppointment.disabledDescription")}
        </ActionSheetEmpty>
      )}

      <ActionSheetSection title={t("sheet.bookAppointment.recentBookings")}>
        {appointmentsLoading ? (
          <ActionSheetEmpty>{t("sheet.bookAppointment.loading")}</ActionSheetEmpty>
        ) : recentAppointments.length === 0 ? (
          <ActionSheetEmpty>{t("sheet.bookAppointment.noBookings")}</ActionSheetEmpty>
        ) : (
          <ActionSheetList>
            {recentAppointments.map((item) => (
              <ActionSheetListItem key={item.id}>
                <p className="truncate text-body-sm text-ink">
                  {formatAppointmentLabel(item, t("sheet.unknown"))}
                </p>
                <p className="text-caption text-muted-soft">
                  {formatAppointmentWhen(item)} · {formatRelativeTime(item.createdAt, t)}
                </p>
              </ActionSheetListItem>
            ))}
          </ActionSheetList>
        )}
      </ActionSheetSection>
    </ActionSheetShell>
  );
}
