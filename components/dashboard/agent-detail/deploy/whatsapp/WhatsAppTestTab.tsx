"use client";

import { Check, Circle } from "lucide-react";

import type { AgentWhatsAppSettings } from "@/lib/actions/whatsapp-connection";
import { isWhatsAppReady } from "@/lib/deploy/whatsapp-config";
import { cn } from "@/lib/utils";

type WhatsAppTestTabProps = {
  agentName: string;
  settings: AgentWhatsAppSettings;
};

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2.5 text-body-sm">
      {done ? (
        <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <Circle className="mt-0.5 size-4 shrink-0 text-muted-soft" aria-hidden />
      )}
      <span className={cn(done ? "text-ink" : "text-muted")}>{label}</span>
    </li>
  );
}

export function WhatsAppTestTab({ agentName, settings }: WhatsAppTestTabProps) {
  const { readiness } = settings;
  const ready = isWhatsAppReady(readiness);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Readiness checklist</h2>
        <ul className="mt-4 space-y-2.5">
          <ChecklistItem done={readiness.platformConfigured} label="Twilio credentials configured" />
          <ChecklistItem done={readiness.channelEnabled} label="WhatsApp enabled for this agent" />
          <ChecklistItem done={readiness.agentPublic} label="Agent visibility is Public" />
          <ChecklistItem done={readiness.agentActive} label="Agent status is Active" />
          <ChecklistItem done={readiness.mappingActive} label="Sender number linked on Connect tab" />
        </ul>

        {ready ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-caption text-emerald-800">
            All checks passed — send a test message to your linked number.
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-caption text-amber-800">
            Complete the items above, then configure the Twilio webhook on the Setup tab.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Test messaging</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          From WhatsApp on your phone, send a text message to{" "}
          {settings.connection ? (
            <span className="font-mono font-medium text-ink">
              {settings.connection.twilioNumber}
            </span>
          ) : (
            "your linked sender number"
          )}
          . If the webhook is configured, <span className="text-ink">{agentName}</span> will reply
          automatically.
        </p>

        <div className="mt-4 rounded-lg border border-hairline bg-canvas-soft/60 p-3">
          <p className="text-caption text-muted">
            Sandbox: join the Twilio sandbox first (Messaging → Try WhatsApp). Production: customers
            must message your approved business number within the 24-hour session window for
            free-form replies.
          </p>
        </div>
      </section>
    </div>
  );
}
