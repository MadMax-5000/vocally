"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckIcon, CopyIcon, ExternalLink } from "@/lib/icons/app-icons"

import { useState } from "react";

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
}: {
  label: string;
  value: string;
  description?: string;
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
          aria-label={`Copy ${label}`}
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
  const blockingIssue = !smsEnabled
    ? "Enable SMS to connect a phone number and receive messages."
    : !settings.platformConfigured
      ? "Twilio credentials are not configured on this deployment."
      : null;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Prerequisites</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          SMS messaging uses Twilio. You need an SMS-capable phone number and inbound
          webhooks pointed at Vocally.
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
            Twilio SMS docs <AppIcon icon={ExternalLink} className="ml-1.5 size-3.5" />
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Webhook URL</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          In Twilio Console, set <span className="text-ink">When a message comes in</span> to
          this URL (HTTP POST) for your SMS-capable phone number.
        </p>

        <div className="mt-4 space-y-3">
          <CopyField
            label="Inbound webhook"
            value={settings.webhookUrl}
            description="Phone Numbers → Manage → Active Numbers → select your number → Messaging"
          />
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Twilio Console steps</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-body-sm text-muted">
          <li>
            Purchase an SMS-capable phone number in Twilio Console (or use an existing one).
          </li>
          <li>
            Open Phone Numbers → Manage → Active Numbers → select your number.
          </li>
          <li>
            Under <span className="text-ink">Messaging</span>, paste the webhook URL above into{" "}
            <span className="text-ink">When a message comes in</span> (HTTP POST).
          </li>
          <li>
            Open the <span className="text-ink">Connect</span> tab to link your phone number to
            this agent.
          </li>
        </ol>
        <a
          className="btn-outline mt-4 inline-flex items-center"
          href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
          target="_blank"
          rel="noreferrer"
        >
          Open Twilio Phone Numbers <AppIcon icon={ExternalLink} className="ml-1.5 size-3.5" />
        </a>
      </section>
    </div>
  );
}
