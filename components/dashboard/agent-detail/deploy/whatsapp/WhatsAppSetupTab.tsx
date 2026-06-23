"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
} from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSettingRow";
import type { AgentWhatsAppSettings } from "@/lib/actions/whatsapp-connection";
import { cn } from "@/lib/utils";

type WhatsAppSetupTabProps = {
  whatsappEnabled: boolean;
  isPublic: boolean;
  isActive: boolean;
  settings: AgentWhatsAppSettings;
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
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </ChatWidgetSettingRow>
  );
}

export function WhatsAppSetupTab({
  whatsappEnabled,
  isPublic,
  isActive,
  settings,
}: WhatsAppSetupTabProps) {
  const blockingIssue = !whatsappEnabled
    ? "Enable WhatsApp to connect a sender number and receive messages."
    : !isPublic
      ? "Set agent visibility to Public to serve real customers."
      : !isActive
        ? "Set agent status to Active to reply automatically."
        : !settings.platformConfigured
          ? "Twilio credentials are not configured on this deployment."
          : null;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Prerequisites</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          WhatsApp messaging uses Twilio. You need a WhatsApp-enabled sender (sandbox or
          production) and inbound webhooks pointed at Vocally.
        </p>

        {blockingIssue ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-caption text-amber-800">
            {blockingIssue}
          </div>
        ) : null}

        <div className="mt-4">
          <a
            className="btn-outline inline-flex items-center"
            href="https://www.twilio.com/docs/whatsapp/api"
            target="_blank"
            rel="noreferrer"
          >
            Twilio WhatsApp docs <ExternalLink className="ml-1.5 size-3.5" />
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Webhook URL</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          In Twilio Console, set <span className="text-ink">When a message comes in</span> to
          this URL (HTTP POST). Use the same URL for sandbox and production senders.
        </p>

        <div className="mt-4 space-y-3">
          <CopyField
            label="Inbound webhook"
            value={settings.webhookUrl}
            description="Messaging → Try WhatsApp (sandbox) or your WhatsApp sender → Configuration"
          />
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Twilio Console steps</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-body-sm text-muted">
          <li>
            <span className="text-ink">Sandbox:</span> Messaging → Try it out → Send a WhatsApp
            message → paste the webhook URL above.
          </li>
          <li>
            Join the sandbox from your phone using the join code shown in Twilio (account-specific).
          </li>
          <li>
            <span className="text-ink">Production:</span> Messaging → Senders → select your WhatsApp
            sender → set the webhook URL.
          </li>
          <li>
            Open the <span className="text-ink">Connect</span> tab to link your sender number to
            this agent.
          </li>
        </ol>
        <a
          className="btn-outline mt-4 inline-flex items-center"
          href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
          target="_blank"
          rel="noreferrer"
        >
          Open Twilio WhatsApp sandbox <ExternalLink className="ml-1.5 size-3.5" />
        </a>
      </section>
    </div>
  );
}
