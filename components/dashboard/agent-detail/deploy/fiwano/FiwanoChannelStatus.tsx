"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { saveFiwanoChannel, getFiwanoChannelsForAgent, removeFiwanoChannel } from "@/lib/actions/fiwano";

type Props = {
  agentId: string;
  channelType: "INSTAGRAM" | "MESSENGER";
  iconSrc: string;
  channelLabel: string;
  fiwanoChannelId: string;
};

export function FiwanoChannelStatus({ agentId, channelType, iconSrc, channelLabel, fiwanoChannelId }: Props) {
  const t = useTranslations("dashboard.deploy.channels.common");
  const [connected, setConnected] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getFiwanoChannelsForAgent(agentId);
      if (result.success) {
        const found = result.data.find((c: { channelType: string }) => c.channelType === channelType);
        if (found) {
          setConnected(true);
          setChannelId(found.channelId);
        }
      }
    });
  }, [agentId, channelType]);

  function handleConnect() {
    startTransition(async () => {
      const result = await saveFiwanoChannel(agentId, fiwanoChannelId, channelType);
      if (!result.success) {
        toast.error(result.error ?? "Failed to connect");
        return;
      }
      setConnected(true);
      setChannelId(fiwanoChannelId);
      toast.success(`${channelLabel} connected via Fiwano`);
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await removeFiwanoChannel(agentId, channelId);
      if (!result.success) return;
      setConnected(false);
      setChannelId("");
      toast.success(`${channelLabel} disconnected`);
    });
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-hairline bg-canvas-soft">
          <Image src={iconSrc} alt="" width={32} height={32} className="size-8" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="text-body-sm font-medium text-ink">{channelLabel}</p>
          <p className="text-caption text-muted">
            Connect via Fiwano — no Meta Business Verification required.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary h-10 rounded-md px-5"
          disabled={pending}
          onClick={handleConnect}
        >
          {pending ? "Connecting..." : `Connect ${channelLabel}`}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
        <div className="flex items-start gap-3">
          <Image src={iconSrc} alt="" width={28} height={28} className="mt-0.5 size-7 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-medium text-ink">{t("connected")}</p>
            <p className="mt-0.5 truncate text-body-sm text-muted">
              {channelLabel} — Fiwano ({channelId.slice(0, 8)}...)
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            {t("active")}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-4">
        <p className="text-body-sm font-medium text-ink">Webhook</p>
        <p className="mt-1 text-caption text-muted">
          Messages delivered to <code className="text-ink">/api/webhooks/fiwano</code>
        </p>
        <p className="mt-1 text-caption text-muted">Managed in Fiwano dashboard → Channel settings.</p>
      </div>

      <button
        type="button"
        className="btn-outline h-9 rounded-md text-red-600 hover:text-red-700"
        disabled={pending}
        onClick={handleDisconnect}
      >
        {t("disconnect")}
      </button>
    </div>
  );
}
