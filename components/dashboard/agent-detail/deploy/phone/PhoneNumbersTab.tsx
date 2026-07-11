"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckCircle, InfoIcon, LoaderIcon, PhoneIcon, PhoneForwarded } from "@/lib/icons/app-icons"

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  setupPhoneForwarding,
  disconnectPhoneForwarding,
  type PhoneConnectionSettings,
} from "@/lib/actions/phone-connection";
import { cn } from "@/lib/utils";

type PhoneNumbersTabProps = {
  agentId: string;
  phoneEnabled: boolean;
  settings: PhoneConnectionSettings;
  onSettingsRefresh: () => Promise<void>;
};

export function PhoneNumbersTab({
  agentId,
  phoneEnabled,
  settings,
  onSettingsRefresh,
}: PhoneNumbersTabProps) {
  const t = useTranslations("dashboard.deploy.channels.phone");
  const tCommon = useTranslations("dashboard.deploy.channels.common");
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [customerNumber, setCustomerNumber] = useState(settings.customerNumber ?? "");
  const [saved, setSaved] = useState(false);
  const [forwardingType, setForwardingType] = useState("unconditional");

  useEffect(() => {
    setCustomerNumber(settings.customerNumber ?? "");
  }, [settings.customerNumber]);

  const handleConnect = useCallback(async () => {
    if (!customerNumber.trim() || !phoneEnabled) return;

    setIsSaving(true);
    setSaved(false);

    const result = await setupPhoneForwarding(agentId, customerNumber.trim());

    setIsSaving(false);

    if (result.success) {
      setSaved(true);
      toast.success(t("connected"));
      setTimeout(() => setSaved(false), 3000);
      await onSettingsRefresh();
    } else {
      toast.error(result.error || t("connectFailed"));
    }
  }, [agentId, customerNumber, phoneEnabled, onSettingsRefresh, t]);

  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);

    const result = await disconnectPhoneForwarding(agentId);

    setIsDisconnecting(false);

    if (result.success) {
      toast.success(t("disconnected"));
      setCustomerNumber("");
      await onSettingsRefresh();
    } else {
      toast.error(result.error || t("disconnectFailed"));
    }
  }, [agentId, onSettingsRefresh, t]);

  if (!phoneEnabled) {
    return (
      <div className="rounded-xl border border-hairline bg-surface-card p-6">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-canvas-soft">
            <AppIcon icon={PhoneIcon} className="size-6 text-muted-soft" />
          </div>
          <div>
            <p className="text-body-sm font-medium text-ink">{t("disabledTitle")}</p>
            <p className="mt-1 text-caption text-muted-soft">
              {t("disabledDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isConnected = settings.isActive && settings.connectionId;

  if (isConnected) {
    const rawNumber = settings.forwardingNumber.replace(/[^0-9]/g, "");
    const ussdCodes = {
      unconditional: `*21*${rawNumber}#`,
      busy: `*67*${rawNumber}#`,
      noAnswer: `*61*${rawNumber}#`,
      unreachable: `*62*${rawNumber}#`,
    };
    const selectedCode = forwardingType === "unconditional"
      ? ussdCodes.unconditional
      : forwardingType === "busy"
        ? ussdCodes.busy
        : forwardingType === "noAnswer"
          ? ussdCodes.noAnswer
          : ussdCodes.unreachable;

    return (
      <div className="space-y-4">
        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <AppIcon icon={PhoneForwarded} className="size-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-title-sm font-medium text-ink">{tCommon("connected")}</p>
              <p className="mt-1 text-body-sm text-muted">
                {t.rich("forwardsTo", {
                  number: (chunks) => <span className="font-mono text-ink">{chunks}</span>,
                  phoneNumber: settings.customerNumber ?? "",
                })}
              </p>
              <div className="mt-3 rounded-lg border border-hairline bg-canvas-soft/50 p-3">
                <p className="text-caption font-medium text-ink">{t("forwardingDestination")}</p>
                <p className="mt-0.5 font-mono text-body-sm text-ink">
                  {settings.forwardingNumber}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              {tCommon("active")}
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <h2 className="text-title-sm font-medium text-ink">{t("setupTitle")}</h2>
          <p className="mt-1 text-body-sm leading-relaxed text-muted">
            {t("setupDescription")}
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-caption font-medium text-muted">
                1
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium text-ink">{t("forwardingType")}</p>
                <Select value={forwardingType} onValueChange={setForwardingType}>
                  <SelectTrigger className="h-10 w-full border-hairline-strong bg-surface-card text-body-sm sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unconditional">{t("allCalls")}</SelectItem>
                    <SelectItem value="busy">{t("whenBusy")}</SelectItem>
                    <SelectItem value="noAnswer">{t("whenNoAnswer")}</SelectItem>
                    <SelectItem value="unreachable">{t("whenUnreachable")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-caption font-medium text-muted">
                2
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium text-ink">{t("copyCode")}</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="inline-flex items-center rounded-lg border border-hairline bg-canvas-soft px-3 py-2 font-mono text-body-sm text-ink">
                    {selectedCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCode);
                      toast.success(t("codeCopied"));
                    }}
                    className="btn-outline h-8 shrink-0 rounded-md px-3 text-caption"
                  >
                    {tCommon("copy")}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-caption font-medium text-muted">
                3
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium text-ink">{t("dialCode")}</p>
                <p className="mt-0.5 text-caption text-muted">
                  {t("dialCodeDescription")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
              <AppIcon icon={InfoIcon} className="size-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-ink">{t("disableForwarding")}</p>
              <p className="mt-0.5 text-caption text-muted">
                {t.rich("disableForwardingDescription", { code: (chunks) => <code className="font-mono text-ink">{chunks}</code> })}
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-md text-red-600 hover:text-red-700"
            disabled={isDisconnecting}
            onClick={handleDisconnect}
          >
            {isDisconnecting ? <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" /> : null}
            {tCommon("disconnect")}
          </Button>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-caption text-muted-soft underline decoration-dotted underline-offset-2 hover:text-muted"
                >
                  {t("carrierQuestion")}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-body-sm">
                {t.rich("carrierAnswer", { code: (chunks) => <code className="font-mono">{chunks}</code> })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-hairline bg-canvas-soft">
            <AppIcon icon={PhoneIcon} className="size-5 text-muted-soft" />
          </div>
          <div className="min-w-0">
            <h2 className="text-title-sm font-medium text-ink">
              {t("connectBusinessNumber")}
            </h2>
            <p className="mt-1 text-body-sm leading-relaxed text-muted">
              {t("connectBusinessDescription")}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-body-sm font-medium text-ink">{t("businessNumber")}</p>
          <p className="text-caption text-muted-soft">
            {t("numberFormat")}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="tel"
                value={customerNumber}
                onChange={(e) => {
                  setCustomerNumber(e.target.value);
                  setSaved(false);
                }}
                placeholder={t("numberFormat")}
                className={cn(
                  "pr-10 font-mono",
                  saved && "border-emerald-500 bg-emerald-50/50",
                )}
                autoComplete="tel"
                disabled={isSaving}
              />
              {saved && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AppIcon icon={CheckCircle} className="size-5 text-emerald-600" />
                </div>
              )}
            </div>
            <Button
              type="button"
              className="btn-primary h-10 shrink-0 rounded-md"
              disabled={isSaving || !customerNumber.trim()}
              onClick={handleConnect}
            >
              {isSaving ? (
                <>
                  <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
                  {t("connecting")}
                </>
              ) : (
                t("connect")
              )}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-lg border border-hairline bg-canvas-soft/50 p-3">
          <AppIcon icon={PhoneIcon} className="mt-0.5 size-4 shrink-0 text-muted" />
          <p className="text-caption leading-relaxed text-muted">
            {t("activationNotice")}
          </p>
        </div>
      </section>
    </div>
  );
}
