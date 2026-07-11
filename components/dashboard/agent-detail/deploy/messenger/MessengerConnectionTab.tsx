"use client";

import { useMemo, useTransition } from "react";
import Image from "next/image";
import { AppIcon } from "@/components/ui/app-icon";
import { LoaderIcon, UnplugIcon } from "@/lib/icons/app-icons";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  disconnectMessenger,
  type AgentMessengerSettings,
} from "@/lib/actions/messenger-connection";

type Props = {
  agentId: string;
  settings: AgentMessengerSettings;
  onSettingsRefresh: () => Promise<void>;
};

function formatDate(d: Date | null, locale: string): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(d);
}

function getPublicBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "");
  return base.replace(/\/$/, "");
}

export function MessengerConnectionTab({ agentId, settings, onSettingsRefresh }: Props) {
  const t = useTranslations("dashboard.deploy.channels.messenger");
  const tCommon = useTranslations("dashboard.deploy.channels.common");
  const locale = useLocale();
  const [disconnectPending, startDisconnect] = useTransition();
  const connection = settings.connection;

  const callbackUrl = useMemo(() => {
    const base = getPublicBaseUrl();
    if (!base) return null;
    const url = new URL(`${base}/api/webhooks/meta/messenger`);
    url.searchParams.set("agentId", agentId);
    return url.toString();
  }, [agentId]);

  function handleConnect() {
    window.location.href = `/api/oauth/meta/start?agentId=${encodeURIComponent(agentId)}`;
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await disconnectMessenger(agentId);
      if (!result.success) {
        toast.error(result.error ?? t("couldNotDisconnect"));
        return;
      }
      toast.success(t("disconnected"));
      await onSettingsRefresh();
    });
  }

  if (!connection) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-hairline bg-canvas-soft">
          <Image src="/svg/messenger.svg" alt="" width={32} height={32} className="size-8" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="text-body-sm font-medium text-ink">{t("connect")}</p>
          <p className="text-caption text-muted">
            {t("connectDescription")}
          </p>
        </div>
        <Button type="button" className="btn-primary h-10 rounded-md px-5" onClick={handleConnect}>
          {t("connectFacebookPage")}
        </Button>
        <p className="max-w-sm text-caption text-muted-soft">
          {t.rich("developmentNotice", { permission: (chunks) => <span className="text-ink">{chunks}</span> })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
        <div className="flex items-start gap-3">
          <Image
            src="/svg/messenger.svg"
            alt=""
            width={28}
            height={28}
            className="mt-0.5 size-7 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-medium text-ink">{tCommon("connected")}</p>
            <p className="mt-0.5 truncate text-body-sm text-muted">
              {connection.pageName ?? t("facebookPage")} ({connection.pageId})
            </p>
            <p className="mt-2 text-caption text-muted-soft">
              {t("connectedAt", { date: formatDate(connection.connectedAt, locale) })}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            {tCommon("active")}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-4">
        <p className="text-body-sm font-medium text-ink">{t("webhookConfiguration")}</p>
        <p className="mt-1 text-caption text-muted">
          {t.rich("webhookDescription", { field: (chunks) => <span className="text-ink">{chunks}</span> })}
        </p>

        <div className="mt-3 grid gap-3">
          <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3">
            <p className="text-caption text-muted">{t("callbackUrl")}</p>
            <p className="mt-0.5 break-all text-body-sm text-ink">
              {callbackUrl ?? t("missingAppUrl")}
            </p>
          </div>
          <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3">
            <p className="text-caption text-muted">{t("verifyToken")}</p>
            <p className="mt-0.5 break-all text-body-sm text-ink">
              {connection.webhookVerifyToken}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-9 flex-1 rounded-md text-red-600 hover:text-red-700"
          disabled={disconnectPending}
          onClick={handleDisconnect}
        >
          {disconnectPending ? (
            <AppIcon icon={LoaderIcon} size={16} className="mr-2 size-4 animate-spin" />
          ) : (
            <AppIcon icon={UnplugIcon} size={16} className="mr-2 size-4" />
          )}
          {tCommon("disconnect")}
        </Button>
      </div>
    </div>
  );
}

