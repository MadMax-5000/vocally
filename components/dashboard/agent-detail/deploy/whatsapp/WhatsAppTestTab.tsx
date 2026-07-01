"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { CheckIcon, CircleIcon } from "@/lib/icons/app-icons";

import type { AgentWhatsAppSettings } from "@/lib/actions/whatsapp-connection";
import { cn } from "@/lib/utils";

type WhatsAppTestTabProps = {
  agentName: string;
  settings: AgentWhatsAppSettings;
};

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2.5 text-body-sm">
      {done ? (
        <AppIcon icon={CheckIcon} size={16} className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <AppIcon icon={CircleIcon} size={16} className="mt-0.5 size-4 shrink-0 text-muted-soft" aria-hidden />
      )}
      <span className={cn(done ? "text-ink" : "text-muted")}>{label}</span>
    </li>
  );
}

export function WhatsAppTestTab({ agentName, settings }: WhatsAppTestTabProps) {
  const { readiness, connection } = settings;
  const ready =
    readiness.channelEnabled &&
    readiness.agentActive &&
    readiness.agentPublic &&
    readiness.connectionOnline &&
    readiness.platformConfigured;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Readiness</h2>
        <ul className="mt-4 space-y-2.5">
          <ChecklistItem done={readiness.platformConfigured} label="Platform messaging configured" />
          <ChecklistItem done={readiness.channelEnabled} label="WhatsApp enabled for this agent" />
          <ChecklistItem done={readiness.agentPublic} label="Agent visibility is Public" />
          <ChecklistItem done={readiness.agentActive} label="Agent status is Active" />
          <ChecklistItem
            done={readiness.connectionOnline}
            label="WhatsApp number connected and online"
          />
        </ul>

        {ready ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-caption text-emerald-800">
            Ready — send a test message from your phone.
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-caption text-amber-800">
            Complete the Connect tab steps, then ensure your agent is Public and Active.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Test messaging</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          From WhatsApp on your phone, send a message to{" "}
          {connection ? (
            <span className="font-mono font-medium text-ink">{connection.twilioNumber}</span>
          ) : (
            "your connected number"
          )}
          . <span className="text-ink">{agentName}</span> should reply automatically.
        </p>
      </section>
    </div>
  );
}
