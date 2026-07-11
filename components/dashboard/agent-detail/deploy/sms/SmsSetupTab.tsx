"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckIcon, CopyIcon, ExternalLink } from "@/lib/icons/app-icons"

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
} from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSettingRow";
import type { AgentSmsSettings } from "@/lib/actions/sms-connection";
import { cn } from "@/lib/utils";

type SmsSetupTabProps = {
  smsEnabled: boolean;
  settings: AgentSmsSettings;
};

function CopyField({
  label,
  value,
  description,
  copyLabel,
}: {
  label: string;
  value: string;
  description?: string;
  copyLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied */
    }
  }

  return (
    <ChatWidgetSettingRow label={label} description={description}>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          className={cn(chatWidgetFieldInputClass, "font-mono text-caption")}
          aria-label={label}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-lg border-hairline"
          onClick={handleCopy}
          aria-label={copyLabel}
        >
          {copied ? <AppIcon icon={CheckIcon} className="size-4" /> : <AppIcon icon={CopyIcon} className="size-4" />}
        </Button>
      </div>
    </ChatWidgetSettingRow>
  );
}

export function SmsSetupTab({
  smsEnabled,
  settings,
}: SmsSetupTabProps) {
  const t = useTranslations("dashboard.deploy.messaging.sms.setup");
  const blockingIssue = !smsEnabled
    ? t("issues.smsDisabled")
    : !settings.platformConfigured
      ? t("issues.platformNotConfigured")
      : null;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">{t("prerequisites.title")}</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          {t("prerequisites.description")}
        </p>

        {blockingIssue ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-caption text-amber-800">
            {blockingIssue}
          </div>
        ) : null}

        <div className="mt-4">
          <a
            className="btn-outline inline-flex items-center"
            href="https://www.twilio.com/docs/sms"
            target="_blank"
            rel="noreferrer"
          >
            {t("twilioDocs")} <AppIcon icon={ExternalLink} className="ml-1.5 size-3.5" />
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">{t("webhook.title")}</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          {t.rich("webhook.description", {
            incomingMessage: (chunks) => <span className="text-ink">{chunks}</span>,
          })}
        </p>

        <div className="mt-4 space-y-3">
          <CopyField
            label={t("webhook.inboundWebhook")}
            value={settings.webhookUrl}
            description={t("webhook.fieldDescription")}
            copyLabel={t("webhook.copy", { label: t("webhook.inboundWebhook") })}
          />
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">{t("steps.title")}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-body-sm text-muted">
          <li>{t("steps.purchaseNumber")}</li>
          <li>{t("steps.openPhoneNumbers")}</li>
          <li>
            {t.rich("steps.configureWebhook", {
              messaging: (chunks) => <span className="text-ink">{chunks}</span>,
              incomingMessage: (chunks) => <span className="text-ink">{chunks}</span>,
            })}
          </li>
          <li>
            {t.rich("steps.connectNumber", {
              connect: (chunks) => <span className="text-ink">{chunks}</span>,
            })}
          </li>
        </ol>
        <a
          className="btn-outline mt-4 inline-flex items-center"
          href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
          target="_blank"
          rel="noreferrer"
        >
          {t("openTwilioPhoneNumbers")} <AppIcon icon={ExternalLink} className="ml-1.5 size-3.5" />
        </a>
      </section>
    </div>
  );
}
