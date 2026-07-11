"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { LoaderIcon, UnplugIcon } from "@/lib/icons/app-icons"

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
} from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSettingRow";
import {
  connectSmsForAgent,
  disconnectSmsForAgent,
  type AgentSmsSettings,
} from "@/lib/actions/sms-connection";
import { cn } from "@/lib/utils";

type Props = {
  agentId: string;
  settings: AgentSmsSettings;
  onSettingsRefresh: () => Promise<void>;
};

export function SmsConnectTab({ agentId, settings, onSettingsRefresh }: Props) {
  const t = useTranslations("dashboard.deploy.messaging.sms.connect");
  const locale = useLocale();
  const [connectPending, startConnect] = useTransition();
  const [disconnectPending, startDisconnect] = useTransition();
  const [phoneNumber, setPhoneNumber] = useState(
    () => settings.connection?.twilioNumber ?? settings.suggestedNumber ?? "",
  );

  const connection = settings.connection;
  const formatDate = (date: Date | null): string => {
    if (!date) return "—";
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: false,
    }).format(new Date(date));
  };

  useEffect(() => {
    if (!connection && settings.suggestedNumber && !phoneNumber) {
      setPhoneNumber(settings.suggestedNumber);
    }
  }, [connection, settings.suggestedNumber, phoneNumber]);

  function handleConnect() {
    startConnect(async () => {
      const result = await connectSmsForAgent(agentId, { phoneNumber });
      if (!result.success) {
        toast.error(result.error ?? t("errors.couldNotConnect"));
        return;
      }
      toast.success(t("toasts.linked"));
      await onSettingsRefresh();
    });
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await disconnectSmsForAgent(agentId);
      if (!result.success) {
        toast.error(result.error ?? t("errors.couldNotDisconnect"));
        return;
      }
      toast.success(t("toasts.disconnected"));
      setPhoneNumber(settings.suggestedNumber ?? "");
      await onSettingsRefresh();
    });
  }

  if (!connection) {
    return (
      <div className="space-y-4">
        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-hairline bg-canvas-soft">
              <Image src="/svg/send.svg" alt="" width={24} height={24} className="size-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-title-sm font-medium text-ink">{t("link.title")}</h2>
              <p className="mt-1 text-body-sm leading-relaxed text-muted">
                {t("link.description")}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <ChatWidgetSettingRow
              label={t("link.phoneNumber")}
              description={t("link.phoneNumberDescription")}
            >
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+14155238886"
                className={cn(chatWidgetFieldInputClass, "font-mono")}
                autoComplete="tel"
              />
            </ChatWidgetSettingRow>
          </div>

          <Button
            type="button"
            className="btn-primary mt-4 h-10 w-full rounded-md sm:w-auto"
            disabled={connectPending || !phoneNumber.trim()}
            onClick={handleConnect}
          >
            {connectPending ? (
              <>
                <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
                {t("connecting")}
              </>
            ) : (
              t("connectSms")
            )}
          </Button>

          <p className="mt-3 text-caption text-muted-soft">
            {t("link.reassignmentNotice")}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
        <div className="flex items-start gap-3">
          <Image
            src="/svg/send.svg"
            alt=""
            width={28}
            height={28}
            className="mt-0.5 size-7 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-medium text-ink">{t("connected")}</p>
            <p className="mt-0.5 font-mono text-body-sm text-muted">{connection.twilioNumber}</p>
            <p className="mt-2 text-caption text-muted-soft">
              {t("linked", { date: formatDate(connection.connectedAt) })}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            {t("active")}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-4">
        <p className="text-body-sm font-medium text-ink">{t("webhook.title")}</p>
        <p className="mt-1 text-caption text-muted">
          {t("webhook.description")}
        </p>
        <p className="mt-2 break-all rounded-lg border border-hairline bg-canvas-soft/50 p-3 font-mono text-caption text-ink">
          {settings.webhookUrl}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-9 w-full rounded-md text-red-600 hover:text-red-700 sm:w-auto"
        disabled={disconnectPending}
        onClick={handleDisconnect}
      >
        {disconnectPending ? (
          <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
        ) : (
          <AppIcon icon={UnplugIcon} className="mr-2 size-4" />
        )}
        {t("disconnect")}
      </Button>
    </div>
  );
}
