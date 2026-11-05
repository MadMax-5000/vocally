"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  connectHostaway,
  disconnectHostaway,
  updateHostawaySettings,
  type HostawaySettings,
} from "@/lib/actions/hostaway";
import { ArrowLeftIcon } from "@/lib/icons/app-icons";
import { Link } from "@/i18n/routing";

import type { AgentDetailWithRelations } from "../agent-detail-types";

export type HostawayDeployChannel = "hostaway" | "airbnb" | "booking-com";

type Props = {
  agent: AgentDetailWithRelations;
  initialSettings: HostawaySettings;
  /** Which deployment card opened this screen. All use the same Hostaway link. */
  channel?: HostawayDeployChannel;
};

export function DeployHostawayManage({
  agent,
  initialSettings,
  channel = "hostaway",
}: Props) {
  const t = useTranslations("dashboard.deploy.channels.hostaway");
  const tCommon = useTranslations("dashboard.deploy.common");
  const locale = useLocale();
  const router = useRouter();

  const [settings, setSettings] = useState(initialSettings);
  const [accountId, setAccountId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [escalationEmail, setEscalationEmail] = useState(
    initialSettings.connection?.escalationEmail ?? "",
  );
  const [copied, setCopied] = useState(false);
  const [connectPending, startConnect] = useTransition();
  const [updatePending, startUpdate] = useTransition();
  const [disconnectPending, startDisconnect] = useTransition();

  const connection = settings.connection;

  const isAirbnb = channel === "airbnb";
  const isBooking = channel === "booking-com";
  const pageTitle = isAirbnb
    ? t("airbnbTitle")
    : isBooking
      ? t("bookingTitle")
      : t("title");
  const pageSubtitle = isAirbnb
    ? t("airbnbSubtitle")
    : isBooking
      ? t("bookingSubtitle")
      : t("subtitle");
  const pageIconSrc = isAirbnb
    ? "/svg/airbnb.svg"
    : isBooking
      ? "/svg/booking-com.svg"
      : "/svg/hostaway.svg";
  const connectLabel = isAirbnb
    ? t("airbnbConnect")
    : isBooking
      ? t("bookingConnect")
      : t("connect");
  const connectDescription = isAirbnb
    ? t("airbnbConnectDescription")
    : isBooking
      ? t("bookingConnectDescription")
      : t("connectDescription");

  useEffect(() => {
    setEscalationEmail(settings.connection?.escalationEmail ?? "");
  }, [settings.connection?.escalationEmail]);

  function handleConnect(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    startConnect(async () => {
      const result = await connectHostaway(agent.id, {
        accountId,
        apiKey,
        escalationEmail,
      });
      if (!result.success) {
        toast.error(result.error || t("connectFailed"));
        return;
      }
      setSettings(result.data);
      setApiKey("");
      toast.success(t("connected"));
      router.refresh();
    });
  }

  function handleAutoReply(next: boolean) {
    if (!connection) return;
    const previous = settings;
    setSettings({
      ...settings,
      connection: { ...connection, autoReplyEnabled: next },
    });

    startUpdate(async () => {
      const result = await updateHostawaySettings(agent.id, {
        autoReplyEnabled: next,
      });
      if (!result.success) {
        setSettings(previous);
        toast.error(result.error);
        return;
      }
      setSettings(result.data);
      toast.success(t("saved"));
      router.refresh();
    });
  }

  function handleSaveSettings() {
    startUpdate(async () => {
      const result = await updateHostawaySettings(agent.id, { escalationEmail });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSettings(result.data);
      toast.success(t("saved"));
      router.refresh();
    });
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await disconnectHostaway(agent.id);
      if (!result.success) {
        toast.error(result.error || t("couldNotDisconnect"));
        return;
      }
      setSettings({ ...settings, connection: null });
      setAccountId("");
      setApiKey("");
      setEscalationEmail("");
      toast.success(t("disconnected"));
      router.refresh();
    });
  }

  async function copyWebhookUrl() {
    if (!connection) return;
    try {
      await navigator.clipboard.writeText(connection.webhookUrl);
      setCopied(true);
      toast.success(t("copied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copy"));
    }
  }

  const connectedDate = connection
    ? new Date(connection.connectedAt).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="-mx-4 -my-3 flex h-[calc(100dvh-3rem)] min-h-0 overflow-hidden bg-surface-card">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden border-r border-hairline bg-surface-card">
          <div className="shrink-0 border-b border-hairline px-4 pb-4 pt-4">
            <Link
              href={`/dashboard/agents/${agent.id}?tab=deploy`}
              className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-muted transition-colors hover:text-ink"
            >
              <AppIcon icon={ArrowLeftIcon} className="size-3.5" />
              {tCommon("backToDeploy")}
            </Link>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <Image
                  src={pageIconSrc}
                  alt=""
                  width={36}
                  height={36}
                  className="mt-0.5 size-9 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-title-sm font-medium text-ink">{pageTitle}</p>
                  <p className="mt-0.5 text-caption text-muted">{pageSubtitle}</p>
                  <p className="mt-1 text-caption text-muted-soft">
                    {t("poweredByHostaway")}
                  </p>
                </div>
              </div>
              {connection ? (
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-caption text-muted">
                    {connection.autoReplyEnabled ? t("on") : t("off")}
                  </span>
                  <Switch
                    checked={connection.autoReplyEnabled}
                    disabled={updatePending}
                    onCheckedChange={handleAutoReply}
                    aria-label={t("autoReplies")}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {!connection ? (
              <form onSubmit={handleConnect} className="flex flex-col gap-4">
                <p className="text-body-sm text-muted">{connectDescription}</p>

                <label className="flex flex-col gap-1.5">
                  <span className="text-caption font-medium text-ink">
                    {t("accountId")}
                  </span>
                  <input
                    value={accountId}
                    onChange={(event) => setAccountId(event.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    placeholder={t("accountIdPlaceholder")}
                    className="h-10 w-full rounded-md border border-hairline-strong bg-surface-card px-3 text-body-sm text-ink outline-none transition-colors focus:border-ink"
                  />
                  <span className="text-caption text-muted">{t("accountIdHint")}</span>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-caption font-medium text-ink">
                    {t("apiKey")}
                  </span>
                  <input
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder={t("apiKeyPlaceholder")}
                    className="h-10 w-full rounded-md border border-hairline-strong bg-surface-card px-3 text-body-sm text-ink outline-none transition-colors focus:border-ink"
                  />
                  <span className="text-caption text-muted">{t("apiKeyHint")}</span>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-caption font-medium text-ink">
                    {t("escalationEmail")}
                  </span>
                  <input
                    value={escalationEmail}
                    onChange={(event) => setEscalationEmail(event.target.value)}
                    type="email"
                    placeholder={t("escalationEmailPlaceholder")}
                    className="h-10 w-full rounded-md border border-hairline-strong bg-surface-card px-3 text-body-sm text-ink outline-none transition-colors focus:border-ink"
                  />
                  <span className="text-caption text-muted">
                    {t("escalationEmailDescription")}
                  </span>
                </label>

                <Button
                  type="submit"
                  className="btn-primary h-10 rounded-md px-4"
                  disabled={connectPending}
                >
                  {connectPending ? t("connecting") : connectLabel}
                </Button>

                <p className="text-caption text-muted">{t("securityNote")}</p>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                {connection.lastError ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-caption font-medium text-amber-800">
                      {t("lastError")}
                    </p>
                    <p className="mt-0.5 text-caption text-amber-700">
                      {connection.lastError}
                    </p>
                  </div>
                ) : null}

                <section className="rounded-xl border border-hairline bg-canvas-soft/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-caption text-muted">{t("accountId")}</p>
                      <p className="mt-0.5 truncate font-mono text-body-sm text-ink">
                        {connection.accountId}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      {t("connected")}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-2 text-caption">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted">{t("agent")}</dt>
                      <dd className="truncate text-ink">{agent.name}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted">{t("status")}</dt>
                      <dd className="text-ink">{t("statusActive")}</dd>
                    </div>
                    {connectedDate ? (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted">{t("connected")}</dt>
                        <dd className="text-ink">
                          {t("connectedAt", { date: connectedDate })}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>

                <section className="rounded-xl border border-hairline bg-surface-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium text-ink">
                        {t("autoReplies")}
                      </p>
                      <p className="mt-1 text-caption text-muted">
                        {t("autoRepliesDescription")}
                      </p>
                    </div>
                    <Switch
                      checked={connection.autoReplyEnabled}
                      disabled={updatePending}
                      onCheckedChange={handleAutoReply}
                      aria-label={t("autoReplies")}
                    />
                  </div>
                </section>

                <section className="rounded-xl border border-hairline bg-surface-card p-4">
                  <p className="text-body-sm font-medium text-ink">
                    {t("supportedChannels")}
                  </p>
                  <p className="mt-1 text-caption text-muted">
                    {t("supportedChannelsDescription")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {settings.supportedChannels.map((channel) => (
                      <span
                        key={channel.id}
                        className="rounded-full border border-hairline bg-canvas-soft px-2.5 py-1 text-[11px] font-medium text-ink"
                      >
                        {channel.label}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-caption text-muted">
                    <span className="font-medium text-ink">{t("otherChannels")}: </span>
                    {t("otherChannelsDescription")}
                  </p>
                </section>

                <section className="rounded-xl border border-hairline bg-surface-card p-4">
                  <p className="text-body-sm font-medium text-ink">{t("webhook")}</p>
                  <p className="mt-1 text-caption text-muted">
                    {t("webhookDescription")}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md border border-hairline bg-canvas-soft px-2.5 py-2 font-mono text-[11px] text-ink">
                      {connection.webhookUrl}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 rounded-md px-2.5 text-caption"
                      onClick={copyWebhookUrl}
                    >
                      {copied ? t("copied") : t("copy")}
                    </Button>
                  </div>
                </section>

                <section className="rounded-xl border border-hairline bg-surface-card p-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-body-sm font-medium text-ink">
                      {t("escalationEmail")}
                    </span>
                    <input
                      value={escalationEmail}
                      onChange={(event) => setEscalationEmail(event.target.value)}
                      type="email"
                      placeholder={t("escalationEmailPlaceholder")}
                      className="h-10 w-full rounded-md border border-hairline-strong bg-surface-card px-3 text-body-sm text-ink outline-none transition-colors focus:border-ink"
                    />
                    <span className="text-caption text-muted">
                      {t("escalationEmailDescription")}
                    </span>
                  </label>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      className="btn-primary h-9 rounded-md px-4"
                      disabled={updatePending}
                      onClick={handleSaveSettings}
                    >
                      {updatePending ? t("saving") : t("save")}
                    </Button>
                  </div>
                </section>

                <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
                  <a
                    href="https://api.hostaway.com/documentation"
                    target="_blank"
                    rel="noreferrer"
                    className="text-caption text-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    {t("docs")}
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-md border-red-200 px-4 text-red-600 hover:text-red-700"
                    disabled={disconnectPending}
                    onClick={handleDisconnect}
                  >
                    {disconnectPending ? t("disconnecting") : t("disconnect")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-canvas-soft/40">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-5 py-4">
            <div>
              <p className="text-title-sm font-medium text-ink">{t("previewTitle")}</p>
              <p className="mt-0.5 text-caption text-muted">
                {t("previewDescription")}
              </p>
            </div>
            <span className="rounded-full bg-surface-card px-2.5 py-1 text-[11px] font-medium text-muted ring-1 ring-hairline">
              {t("previewOnly")}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
            <div className="rounded-xl border border-hairline bg-surface-card">
              <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-canvas-soft text-caption font-medium text-ink">
                  {agent.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-medium text-ink">
                    {t("previewTitle")}
                  </p>
                  <p className="text-caption text-muted">
                    {pageTitle} · {t("supportedChannels")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-4">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-canvas-soft px-3.5 py-2.5 text-body-sm text-ink">
                  {t("sampleGuest")}
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-body-sm text-on-primary">
                  {t("sampleAgent")}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-hairline bg-surface-card p-4">
              <p className="text-body-sm font-medium text-ink">
                {t("supportedChannels")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {settings.supportedChannels.map((channel) => (
                  <span
                    key={channel.id}
                    className="rounded-full border border-hairline bg-canvas-soft px-2.5 py-1 text-[11px] font-medium text-ink"
                  >
                    {channel.label}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-caption text-muted">
                {t("supportedChannelsDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
