"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckIcon, CircleIcon } from "@/lib/icons/app-icons"

import type { AgentSmsSettings } from "@/lib/actions/sms-connection";
import { isSmsReady } from "@/lib/deploy/sms-config";
import { cn } from "@/lib/utils";

type SmsTestTabProps = {
  agentName: string;
  settings: AgentSmsSettings;
};

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2.5 text-body-sm">
      {done ? (
        <AppIcon icon={CheckIcon} className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <AppIcon icon={CircleIcon} className="mt-0.5 size-4 shrink-0 text-muted-soft" aria-hidden />
      )}
      <span className={cn(done ? "text-ink" : "text-muted")}>{label}</span>
    </li>
  );
}

export function SmsTestTab({ agentName, settings }: SmsTestTabProps) {
  const { readiness } = settings;
  const ready = isSmsReady(readiness);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Readiness checklist</h2>
        <ul className="mt-4 space-y-2.5">
          <ChecklistItem done={readiness.platformConfigured} label="Twilio credentials configured" />
          <ChecklistItem done={readiness.channelEnabled} label="SMS enabled for this agent" />
          <ChecklistItem done={readiness.agentPublic} label="Agent visibility is Public" />
          <ChecklistItem done={readiness.agentActive} label="Agent status is Active" />
          <ChecklistItem done={readiness.mappingActive} label="Phone number linked on Connect tab" />
        </ul>

        {ready ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-caption text-emerald-800">
            All checks passed \u2014 send a test SMS to your linked number.
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
          From your phone, send a text message to{" "}
          {settings.connection ? (
            <span className="font-mono font-medium text-ink">
              {settings.connection.twilioNumber}
            </span>
          ) : (
            "your linked phone number"
          )}
          . If the webhook is configured, <span className="text-ink">{agentName}</span> will reply
          automatically.
        </p>

        <div className="mt-4 rounded-lg border border-hairline bg-canvas-soft/60 p-3">
          <p className="text-caption text-muted">
            Make sure your Twilio number has SMS capabilities enabled. Standard carrier rates
            apply for outbound messages.
          </p>
        </div>
      </section>
    </div>
  );
}
