"use client";

import { useMemo, useTransition } from "react";
import Image from "next/image";
import { Loader2, Unplug } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  disconnectMessenger,
  type AgentMessengerSettings,
} from "@/lib/actions/messenger-connection";

type Props = {
  agentId: string;
  settings: AgentMessengerSettings;
  onSettingsRefresh: () => Promise<void>;
};

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(d);
}

function getPublicBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "");
  return base.replace(/\/$/, "");
}

export function MessengerConnectionTab({ agentId, settings, onSettingsRefresh }: Props) {
  const [disconnectPending, startDisconnect] = useTransition();
  const connection = settings.connection;

  const callbackUrl = useMemo(() => {
    const base = getPublicBaseUrl();
    if (!base) return null;
    const url = new URL(`${base}/api/webhooks/meta/messenger`);
    url.searchParams.set("agentId", agentId);
    return url.toString();
  }, [agentId]);

  function handleConnect() {
    window.location.href = `/api/oauth/meta/start?agentId=${encodeURIComponent(agentId)}`;
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await disconnectMessenger(agentId);
      if (!result.success) {
        toast.error(result.error ?? "Could not disconnect");
        return;
      }
      toast.success("Messenger disconnected");
      await onSettingsRefresh();
    });
  }

  if (!connection) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-hairline bg-canvas-soft">
          <Image src="/svg/messenger.svg" alt="" width={32} height={32} className="size-8" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="text-body-sm font-medium text-ink">Connect Messenger</p>
          <p className="text-caption text-muted">
            Authorize Vocally to manage your Page messaging. You will be redirected to Meta to sign
            in.
          </p>
        </div>
        <Button type="button" className="btn-primary h-10 rounded-md px-5" onClick={handleConnect}>
          Connect Facebook Page
        </Button>
        <p className="max-w-sm text-caption text-muted-soft">
          In development mode, Meta only delivers messages for app roles. For production use, you’ll
          need Advanced Access for permissions like <span className="text-ink">pages_messaging</span>{" "}
          via App Review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
        <div className="flex items-start gap-3">
          <Image
            src="/svg/messenger.svg"
            alt=""
            width={28}
            height={28}
            className="mt-0.5 size-7 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-medium text-ink">Connected</p>
            <p className="mt-0.5 truncate text-body-sm text-muted">
              {connection.pageName ?? "Facebook Page"} ({connection.pageId})
            </p>
            <p className="mt-2 text-caption text-muted-soft">
              Connected {formatDate(connection.connectedAt)}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            Active
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-4">
        <p className="text-body-sm font-medium text-ink">Webhook configuration</p>
        <p className="mt-1 text-caption text-muted">
          In Meta App Dashboard → Webhooks, set the Callback URL and Verify token, then subscribe
          your Page to the <span className="text-ink">messages</span> field.
        </p>

        <div className="mt-3 grid gap-3">
          <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3">
            <p className="text-caption text-muted">Callback URL</p>
            <p className="mt-0.5 break-all text-body-sm text-ink">
              {callbackUrl ?? "Set NEXT_PUBLIC_APP_URL to see your callback URL"}
            </p>
          </div>
          <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3">
            <p className="text-caption text-muted">Verify token</p>
            <p className="mt-0.5 break-all text-body-sm text-ink">
              {connection.webhookVerifyToken}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-9 flex-1 rounded-md text-red-600 hover:text-red-700"
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
    </div>
  );
}

