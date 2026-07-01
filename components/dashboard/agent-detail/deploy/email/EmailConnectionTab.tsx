"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { LoaderIcon, MailIcon, UnplugIcon } from "@/lib/icons/app-icons"

import { useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  disconnectGmail,
  sendGmailTestEmail,
  type AgentGmailSettings,
} from "@/lib/actions/gmail-connection";

type EmailConnectionTabProps = {
  agentId: string;
  gmailSettings: AgentGmailSettings;
  labelNames: string[];
  labelsLoading: boolean;
  onDisconnected: () => void;
};

function formatDate(d: Date | null): string {
  if (!d) return "—";
  // Must be deterministic across SSR + client hydration.
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(d);
}

export function EmailConnectionTab({
  agentId,
  gmailSettings,
  labelNames,
  labelsLoading,
  onDisconnected,
}: EmailConnectionTabProps) {
  const [disconnectPending, startDisconnect] = useTransition();
  const [testPending, startTest] = useTransition();

  const connection = gmailSettings.connection;

  function handleConnect() {
    window.location.href = `/api/oauth/google/start?agentId=${encodeURIComponent(agentId)}`;
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await disconnectGmail(agentId);
      if (!result.success) {
        toast.error(result.error ?? "Could not disconnect");
        return;
      }
      toast.success("Gmail disconnected");
      onDisconnected();
    });
  }

  function handleTestEmail() {
    startTest(async () => {
      const result = await sendGmailTestEmail(agentId);
      if (!result.success) {
        toast.error(result.error ?? "Could not send test email");
        return;
      }
      toast.success("Test email sent to your inbox");
    });
  }

  if (!connection) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-hairline bg-canvas-soft">
          <Image src="/svg/gmail.svg" alt="" width={32} height={32} className="size-8" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="text-body-sm font-medium text-ink">Connect Gmail</p>
          <p className="text-caption text-muted">
            Authorize Vocally to read and send email on behalf of this agent. You will be
            redirected to Google to sign in.
          </p>
        </div>
        <Button type="button" className="btn-primary h-10 rounded-md px-5" onClick={handleConnect}>
          <AppIcon icon={MailIcon} className="mr-2 size-4" />
          Connect Gmail
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
        <div className="flex items-start gap-3">
          <Image src="/svg/gmail.svg" alt="" width={28} height={28} className="mt-0.5 size-7 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-medium text-ink">Connected</p>
            <p className="mt-0.5 truncate text-body-sm text-muted">{connection.googleEmail}</p>
            <p className="mt-2 text-caption text-muted-soft">
              Connected {formatDate(connection.connectedAt)}
            </p>
            <p className="text-caption text-muted-soft">
              Watch renews before {formatDate(connection.watchExpiration)}
            </p>
            <p className="mt-1 text-caption text-muted-soft">
              Labels:{" "}
              {labelsLoading
                ? "Loading…"
                : labelNames.length > 0
                  ? labelNames.join(", ")
                  : connection.labelIds.join(", ")}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            Active
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-9 flex-1 rounded-md"
          disabled={testPending}
          onClick={handleTestEmail}
        >
          {testPending ? (
            <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
          ) : (
            <AppIcon icon={MailIcon} className="mr-2 size-4" />
          )}
          Send test email
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 flex-1 rounded-md text-red-600 hover:text-red-700"
          disabled={disconnectPending}
          onClick={handleDisconnect}
        >
          {disconnectPending ? (
            <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
          ) : (
            <AppIcon icon={UnplugIcon} className="mr-2 size-4" />
          )}
          Disconnect
        </Button>
      </div>

      <p className="text-caption text-muted-soft">
        Inbound mail is delivered via Google Cloud Pub/Sub. Ensure your GCP topic and push
        subscription are configured (see docs/gmail-deploy.md).
      </p>
    </div>
  );
}
