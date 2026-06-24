"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Unplug } from "lucide-react";
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

function formatDate(d: Date | null): string {
  if (!d) return "\u2014";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(d));
}

export function SmsConnectTab({ agentId, settings, onSettingsRefresh }: Props) {
  const [connectPending, startConnect] = useTransition();
  const [disconnectPending, startDisconnect] = useTransition();
  const [phoneNumber, setPhoneNumber] = useState(
    () => settings.connection?.twilioNumber ?? settings.suggestedNumber ?? "",
  );

  const connection = settings.connection;

  useEffect(() => {
    if (!connection && settings.suggestedNumber && !phoneNumber) {
      setPhoneNumber(settings.suggestedNumber);
    }
  }, [connection, settings.suggestedNumber, phoneNumber]);

  function handleConnect() {
    startConnect(async () => {
      const result = await connectSmsForAgent(agentId, { phoneNumber });
      if (!result.success) {
        toast.error(result.error ?? "Could not connect");
        return;
      }
      toast.success("SMS number linked to this agent");
      await onSettingsRefresh();
    });
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await disconnectSmsForAgent(agentId);
      if (!result.success) {
        toast.error(result.error ?? "Could not disconnect");
        return;
      }
      toast.success("SMS number disconnected");
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
              <h2 className="text-title-sm font-medium text-ink">Link phone number</h2>
              <p className="mt-1 text-body-sm leading-relaxed text-muted">
                Enter the SMS-capable Twilio number customers message (E.164 format). Inbound
                messages to this number route to this agent.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <ChatWidgetSettingRow
              label="SMS phone number"
              description="Must match the number configured in Twilio."
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
                <Loader2 className="mr-2 size-4 animate-spin" />
                Connecting\u2026
              </>
            ) : (
              "Connect SMS"
            )}
          </Button>

          <p className="mt-3 text-caption text-muted-soft">
            If this number is already linked to another agent in your organization, connecting here
            will reassign inbound traffic to this agent.
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
            <p className="text-body-sm font-medium text-ink">Connected</p>
            <p className="mt-0.5 font-mono text-body-sm text-muted">{connection.twilioNumber}</p>
            <p className="mt-2 text-caption text-muted-soft">
              Linked {formatDate(connection.connectedAt)}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            Active
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-4">
        <p className="text-body-sm font-medium text-ink">Webhook</p>
        <p className="mt-1 text-caption text-muted">
          Ensure Twilio delivers inbound messages to:
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
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Unplug className="mr-2 size-4" />
        )}
        Disconnect
      </Button>
    </div>
  );
}
