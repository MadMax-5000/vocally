"use client";

import { useCallback, useState } from "react";
import { CheckCircle, ExternalLink, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
} from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSettingRow";
import {
  importTwilioNumberToVapi,
  type AgentPhoneSettings,
} from "@/lib/actions/vapi-phone";
import { cn } from "@/lib/utils";

type PhoneNumbersTabProps = {
  agentId: string;
  phoneEnabled: boolean;
  settings: AgentPhoneSettings;
  onSettingsRefresh: () => Promise<void>;
};

export function PhoneNumbersTab({
  agentId,
  phoneEnabled,
  settings,
  onSettingsRefresh,
}: PhoneNumbersTabProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [numberInput, setNumberInput] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);

  const handleImport = useCallback(async () => {
    if (!numberInput.trim() || !phoneEnabled) return;

    setIsImporting(true);
    setImportSuccess(false);

    const result = await importTwilioNumberToVapi(agentId, numberInput.trim());

    setIsImporting(false);

    if (result.success) {
      setImportSuccess(true);
      toast.success("Twilio number imported and linked to Vapi");
      setNumberInput("");
      setTimeout(() => setImportSuccess(false), 2000);
      await onSettingsRefresh();
    } else {
      toast.error(result.error || "Failed to import number");
    }
  }, [agentId, numberInput, phoneEnabled, onSettingsRefresh]);

  if (!phoneEnabled) {
    return (
      <div className="rounded-xl border border-hairline bg-surface-card p-6">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-canvas-soft">
            <Phone className="size-6 text-muted-soft" />
          </div>
          <div>
            <p className="text-body-sm font-medium text-ink">Phone deployment is disabled</p>
            <p className="mt-1 text-caption text-muted-soft">
              Enable the phone channel above to import and manage Twilio numbers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Import Twilio number</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          Import a Twilio phone number and register it with Vapi. Inbound calls to
          this number route to this agent.
        </p>

        <div className="mt-4">
          <ChatWidgetSettingRow label="Phone number" description="E.164 format including country code (e.g. +2126XXXXXXXX)">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={numberInput}
                  onChange={(e) => {
                    setNumberInput(e.target.value);
                    setImportSuccess(false);
                  }}
                  placeholder="+2126XXXXXXXX"
                  className={cn(
                    chatWidgetFieldInputClass,
                    "pr-10 font-mono",
                    importSuccess && "border-emerald-500 bg-emerald-50/50",
                  )}
                  autoComplete="tel"
                  disabled={isImporting}
                />
                {importSuccess && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="size-5 text-emerald-600" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                className="btn-primary h-10 shrink-0 rounded-md"
                disabled={isImporting || !numberInput.trim()}
                onClick={handleImport}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  "Import"
                )}
              </Button>
            </div>
          </ChatWidgetSettingRow>
        </div>

        <p className="mt-3 text-caption text-muted-soft">
          This registers the number with Vapi and points it to the Vocally webhook for
          AI-powered call handling.
        </p>

        <div className="mt-4">
          <a
            className="btn-outline inline-flex items-center gap-1.5 rounded-md"
            href="https://console.twilio.com"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="size-3.5" />
            Open Twilio Console
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-title-sm font-medium text-ink">Linked numbers</h2>
            <p className="mt-0.5 text-caption text-muted-soft">
              {settings.numbers.length
                ? `${settings.numbers.length} number${settings.numbers.length > 1 ? "s" : ""} linked to this agent`
                : "No numbers linked yet"}
            </p>
          </div>
          {settings.numbers.length > 0 && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-[2px] text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
              {settings.numbers.length} linked
            </span>
          )}
        </div>

        {settings.numbers.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-hairline-strong bg-canvas-soft/50 py-8">
            <Phone className="size-8 text-muted-soft" />
            <p className="text-caption text-muted-soft">
              Import a number above to get started
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-hairline">
            {settings.numbers.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                    <CheckCircle className="size-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-body-sm text-ink">{n.number}</p>
                    <p className="text-caption text-muted-soft">
                      Registered with Vapi
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-[2px] text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
