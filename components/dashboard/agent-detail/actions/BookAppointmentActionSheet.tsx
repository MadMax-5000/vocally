"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { AppIcon } from "@/components/ui/app-icon";
import { LoaderIcon, PlusIcon, Trash2Icon, UnplugIcon } from "@/lib/icons/app-icons";
import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import {
  listAgentAppointments,
  updateBookAppointmentActionSettings,
  type AgentAppointmentListItem,
} from "@/lib/actions/agents";
import {
  disconnectCalendar,
  listConnectedCalendlyEventTypes,
  listConnectedGoogleCalendars,
  updateConnectedGoogleCalendarId,
} from "@/lib/actions/calendar-connection";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import type { BookAppointmentCalendarProvider } from "@/lib/deploy/book-appointment-action";

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
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

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
  const [disconnectPending, startDisconnect] = useTransition();
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
  const [googleCalendars, setGoogleCalendars] = useState<
    { id: string; summary: string; primary: boolean }[]
  >([]);
  const [eventTypes, setEventTypes] = useState<
    { uri: string; name: string; duration: number | null }[]
  >([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const connection = agent.calendarConnection;
  const googleConnected = connection?.provider === "GOOGLE";
  const calendlyConnected = connection?.provider === "CALENDLY";

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

    if (agent.calendarConnection?.provider === "GOOGLE") {
      setOptionsLoading(true);
      void listConnectedGoogleCalendars(agent.id).then((result) => {
        setOptionsLoading(false);
        if (result.success) setGoogleCalendars(result.data);
      });
    } else if (agent.calendarConnection?.provider === "CALENDLY") {
      setOptionsLoading(true);
      void listConnectedCalendlyEventTypes(agent.id).then((result) => {
        setOptionsLoading(false);
        if (result.success) setEventTypes(result.data);
      });
    } else {
      setGoogleCalendars([]);
      setEventTypes([]);
    }
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

  function toggleWeekday(day: number) {
    setDraft((d) => {
      const has = d.workingHours.days.includes(day);
      const days = has
        ? d.workingHours.days.filter((item) => item !== day)
        : [...d.workingHours.days, day].sort((a, b) => a - b);
      return { ...d, workingHours: { ...d.workingHours, days } };
    });
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
        calendarProvider: draft.calendarProvider,
        timezone: draft.timezone.trim(),
        durationMinutes: draft.durationMinutes,
        slotIntervalMinutes: draft.slotIntervalMinutes,
        workingHours: draft.workingHours,
        eventTypeUri: draft.eventTypeUri,
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

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await disconnectCalendar(agent.id);
      if (!result.success) {
        toast.error(result.error ?? t("sheet.bookAppointment.couldNotDisconnect"));
        return;
      }
      toast.success(t("sheet.bookAppointment.calendarDisconnected"));
      setDraft((d) => ({ ...d, calendarProvider: "none", eventTypeUri: "" }));
      router.refresh();
    });
  }

  function handleCalendarIdChange(calendarId: string) {
    startTransition(async () => {
      const result = await updateConnectedGoogleCalendarId(agent.id, { calendarId });
      if (!result.success) {
        toast.error(result.error ?? t("sheet.saveFailed"));
        return;
      }
      router.refresh();
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
            title={t("sheet.bookAppointment.calendarSource")}
            description={t("sheet.bookAppointment.calendarSourceDescription")}
          >
            <RadioGroup
              value={draft.calendarProvider}
              onValueChange={(value) =>
                setDraft((d) => ({
                  ...d,
                  calendarProvider: value as BookAppointmentCalendarProvider,
                }))
              }
              className="flex flex-col gap-2"
            >
              {(["none", "google", "calendly"] as const).map((value) => (
                <label
                  key={value}
                  htmlFor={`calendar-provider-${value}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 transition-colors",
                    draft.calendarProvider === value
                      ? "border-hairline-strong bg-surface-card"
                      : "border-hairline bg-surface-card hover:bg-canvas-soft",
                  )}
                >
                  <RadioGroupItem value={value} id={`calendar-provider-${value}`} />
                  <span className="text-body-sm text-ink">
                    {t(`sheet.bookAppointment.calendar${value.charAt(0).toUpperCase()}${value.slice(1)}`)}
                  </span>
                </label>
              ))}
            </RadioGroup>

            {draft.calendarProvider === "google" ? (
              <div className="mt-3 space-y-3">
                {googleConnected ? (
                  <div className="rounded-md border border-hairline bg-surface-card px-3 py-3">
                    <p className="text-body-sm font-medium text-ink">
                      {t("sheet.bookAppointment.connectedAs", {
                        account: connection?.accountEmail ?? connection?.calendarId ?? "",
                      })}
                    </p>
                    <div className="mt-2">
                      <Select
                        value={connection?.calendarId ?? "primary"}
                        onValueChange={handleCalendarIdChange}
                        disabled={optionsLoading || pending}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder={t("sheet.bookAppointment.googleCalendar")} />
                        </SelectTrigger>
                        <SelectContent>
                          {googleCalendars.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.summary}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 h-8 border-hairline text-red-600 hover:text-red-700"
                      disabled={disconnectPending}
                      onClick={handleDisconnect}
                    >
                      {disconnectPending ? (
                        <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
                      ) : (
                        <AppIcon icon={UnplugIcon} className="mr-2 size-4" />
                      )}
                      {t("sheet.bookAppointment.disconnectCalendar")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-caption text-muted">
                      {t("sheet.bookAppointment.googleAuthorize")}
                    </p>
                    <Button
                      type="button"
                      className="btn-primary h-9 rounded-md px-4"
                      onClick={() => {
                        window.location.href = `/api/oauth/google-calendar/start?agentId=${encodeURIComponent(agent.id)}`;
                      }}
                    >
                      {t("sheet.bookAppointment.connectGoogle")}
                    </Button>
                  </div>
                )}

                <ActionSheetField
                  label={t("sheet.bookAppointment.timezone")}
                  description={t("sheet.bookAppointment.timezoneDescription")}
                >
                  <Input
                    value={draft.timezone}
                    onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))}
                    className={actionSheetInputClass}
                  />
                </ActionSheetField>
                <ActionSheetField
                  label={t("sheet.bookAppointment.durationMinutes")}
                  description={t("sheet.bookAppointment.durationDescription")}
                >
                  <Input
                    type="number"
                    min={5}
                    max={240}
                    value={draft.durationMinutes}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        durationMinutes: Number(e.target.value) || 30,
                      }))
                    }
                    className={actionSheetInputClass}
                  />
                </ActionSheetField>
                <ActionSheetSection
                  title={t("sheet.bookAppointment.workingHours")}
                  description={t("sheet.bookAppointment.workingHoursDescription")}
                >
                  <div className="mb-3 flex flex-wrap gap-2">
                    {WEEKDAY_ORDER.map((day) => (
                      <label
                        key={day}
                        className="flex items-center gap-1.5 text-caption text-ink"
                      >
                        <Checkbox
                          checked={draft.workingHours.days.includes(day)}
                          onCheckedChange={() => toggleWeekday(day)}
                        />
                        {t(`sheet.bookAppointment.weekday.${WEEKDAY_KEYS[day]}`)}
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="time"
                      value={draft.workingHours.start}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          workingHours: { ...d.workingHours, start: e.target.value },
                        }))
                      }
                      className={actionSheetInputClass}
                    />
                    <Input
                      type="time"
                      value={draft.workingHours.end}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          workingHours: { ...d.workingHours, end: e.target.value },
                        }))
                      }
                      className={actionSheetInputClass}
                    />
                  </div>
                </ActionSheetSection>
              </div>
            ) : null}

            {draft.calendarProvider === "calendly" ? (
              <div className="mt-3 space-y-3">
                <p className="text-caption text-muted">
                  {t("sheet.bookAppointment.calendlyPaidPlan")}
                </p>
                {calendlyConnected ? (
                  <div className="rounded-md border border-hairline bg-surface-card px-3 py-3">
                    <p className="text-body-sm font-medium text-ink">
                      {t("sheet.bookAppointment.connectedAs", {
                        account: connection?.accountEmail ?? "",
                      })}
                    </p>
                    <div className="mt-2">
                      <Select
                        value={draft.eventTypeUri || undefined}
                        onValueChange={(eventTypeUri) =>
                          setDraft((d) => ({ ...d, eventTypeUri }))
                        }
                        disabled={optionsLoading}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder={t("sheet.bookAppointment.selectEventType")} />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((item) => (
                            <SelectItem key={item.uri} value={item.uri}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {eventTypes.length === 0 && !optionsLoading ? (
                      <p className="mt-2 text-caption text-muted-soft">
                        {t("sheet.bookAppointment.noEventTypes")}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 h-8 border-hairline text-red-600 hover:text-red-700"
                      disabled={disconnectPending}
                      onClick={handleDisconnect}
                    >
                      {disconnectPending ? (
                        <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
                      ) : (
                        <AppIcon icon={UnplugIcon} className="mr-2 size-4" />
                      )}
                      {t("sheet.bookAppointment.disconnectCalendar")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-caption text-muted">
                      {t("sheet.bookAppointment.calendlyAuthorize")}
                    </p>
                    <Button
                      type="button"
                      className="btn-primary h-9 rounded-md px-4"
                      onClick={() => {
                        window.location.href = `/api/oauth/calendly/start?agentId=${encodeURIComponent(agent.id)}`;
                      }}
                    >
                      {t("sheet.bookAppointment.connectCalendly")}
                    </Button>
                  </div>
                )}
                <ActionSheetField
                  label={t("sheet.bookAppointment.timezone")}
                  description={t("sheet.bookAppointment.timezoneDescription")}
                >
                  <Input
                    value={draft.timezone}
                    onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))}
                    className={actionSheetInputClass}
                  />
                </ActionSheetField>
              </div>
            ) : null}
          </ActionSheetSection>

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
