"use client";

import { useTransition, useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  getZernioChannelsForAgent,
  removeZernioChannel,
  initiateZernioOAuth,
} from "@/lib/actions/zernio";

type Props = {
  agentId: string;
  platform: "instagram" | "facebook" | "whatsapp";
  iconSrc: string;
  channelLabel: string;
};

export function ZernioOAuthButton({ agentId, platform, iconSrc, channelLabel }: Props) {
  const t = useTranslations("dashboard.deploy.channels.common");
  const [connected, setConnected] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [username, setUsername] = useState("");
  const [pending, startTransition] = useTransition();

  const channelType = platform === "instagram" ? "INSTAGRAM" : platform === "whatsapp" ? "WHATSAPP" : "MESSENGER";

  useEffect(() => {
    startTransition(async () => {
      const result = await getZernioChannelsForAgent(agentId);
      if (result.success) {
        const found = result.data.find((c: { channelType: string }) => c.channelType === channelType);
        if (found) {
          setConnected(true);
          setAccountId(found.accountId);
          setUsername(found.platformUsername ?? "");
        }
      }
    });
  }, [agentId, channelType]);

  function handleConnect() {
    startTransition(async () => {
      const result = await initiateZernioOAuth(agentId, platform);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      window.location.href = result.data.authUrl;
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await removeZernioChannel(agentId, accountId);
      if (!result.success) return;
      setConnected(false);
      setAccountId("");
      setUsername("");
      toast.success(`${channelLabel} disconnected`);
    });
  }

  if (connected) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
          <div className="flex items-start gap-3">
            <Image src={iconSrc} alt="" width={28} height={28} className="mt-0.5 size-7 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-medium text-ink">{t("connected")}</p>
              <p className="mt-0.5 truncate text-body-sm text-muted">
                {username ? `${channelLabel} — ${username}` : channelLabel}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              {t("active")}
            </span>
          </div>
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

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-hairline bg-canvas-soft">
        <Image src={iconSrc} alt="" width={32} height={32} className="size-8" />
      </div>
      <div className="max-w-sm space-y-1">
        <p className="text-body-sm font-medium text-ink">{channelLabel}</p>
        <p className="text-caption text-muted">
          Connect your {channelLabel} account to enable AI responses.
        </p>
      </div>
      <button
        type="button"
        className="btn-primary h-10 rounded-md px-5"
        disabled={pending}
        onClick={handleConnect}
      >
        {pending ? "Loading..." : `Connect ${channelLabel}`}
      </button>
    </div>
  );
}
