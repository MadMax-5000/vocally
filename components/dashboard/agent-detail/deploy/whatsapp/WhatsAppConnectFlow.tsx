"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AppIcon } from "@/components/ui/app-icon";
import { CheckIcon, CircleIcon, LoaderIcon, UnplugIcon } from "@/lib/icons/app-icons";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
} from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSettingRow";
import {
  disconnectWhatsAppForAgent,
  type AgentWhatsAppSettings,
} from "@/lib/actions/whatsapp-connection";
import { cn } from "@/lib/utils";

type Props = {
  agentId: string;
  settings: AgentWhatsAppSettings;
  onSettingsRefresh: () => Promise<void>;
};

type ConnectStep = "idle" | "meta" | "registering" | "otp" | "done" | "failed";

declare global {
  interface Window {
    FB?: {
      init: (opts: Record<string, unknown>) => void;
      login: (
        callback: (response: unknown) => void,
        options: Record<string, unknown>,
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function StepItem({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-body-sm">
      {done ? (
        <AppIcon icon={CheckIcon} size={16} className="size-4 shrink-0 text-emerald-600" />
      ) : active ? (
        <AppIcon icon={LoaderIcon} size={16} className="size-4 shrink-0 animate-spin text-ink" />
      ) : (
        <AppIcon icon={CircleIcon} size={16} className="size-4 shrink-0 text-muted-soft" />
      )}
      <span className={cn(done || active ? "text-ink" : "text-muted")}>{label}</span>
    </li>
  );
}

export function WhatsAppConnectFlow({ agentId, settings, onSettingsRefresh }: Props) {
  const t = useTranslations("dashboard.deploy.messaging.whatsapp.connect");
  const locale = useLocale();
  const [connectPending, startConnect] = useTransition();
  const [disconnectPending, startDisconnect] = useTransition();
  const [otpPending, startOtp] = useTransition();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [connectStep, setConnectStep] = useState<ConnectStep>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pendingWabaId = useRef<string | null>(null);
  const sdkLoaded = useRef(false);

  const connection = settings.connection;
  const isConnected = connection?.status === "ONLINE" || (connection?.isLegacy && connection.isActive);
  const needsOtp = connection?.status === "VERIFYING_OTP";
  const isProvisioning =
    connection?.status === "CREATING" ||
    connection?.status === "PENDING" ||
    connectStep === "registering" ||
    connectStep === "meta";
  const formatDate = useCallback(
    (date: Date | null): string => {
      if (!date) return "—";
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
        hour12: false,
      }).format(new Date(date));
    },
    [locale],
  );

  const loadFacebookSdk = useCallback(() => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (!appId || sdkLoaded.current) return;

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v21.0",
      });
    };

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(script);
    }
    sdkLoaded.current = true;
  }, []);

  useEffect(() => {
    if (!settings.sandboxMode && settings.embeddedSignupConfigured) {
      loadFacebookSdk();
    }
  }, [loadFacebookSdk, settings.embeddedSignupConfigured, settings.sandboxMode]);

  const completeConnection = useCallback(
    async (wabaId?: string) => {
      setConnectStep("registering");
      setErrorMessage(null);

      const res = await fetch("/api/integrations/whatsapp/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          phoneNumber,
          wabaId,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: string;
        data?: { status: string; needsOtp: boolean };
      };

      if (!json.success) {
        setConnectStep("failed");
        setErrorMessage(json.error ?? t("errors.couldNotConnectWhatsApp"));
        toast.error(json.error ?? t("errors.couldNotConnect"));
        return;
      }

      if (json.data?.needsOtp || json.data?.status === "VERIFYING_OTP") {
        setConnectStep("otp");
        await onSettingsRefresh();
        return;
      }

      if (json.data?.status === "ONLINE") {
        setConnectStep("done");
        toast.success(t("toasts.connected"));
        await onSettingsRefresh();
        return;
      }

      setConnectStep("registering");
      await onSettingsRefresh();
    },
    [agentId, onSettingsRefresh, phoneNumber, t],
  );

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return;
      try {
        const data = JSON.parse(event.data as string) as {
          type?: string;
          event?: string;
          data?: { waba_id?: string; error_message?: string };
        };
        if (data.type !== "WA_EMBEDDED_SIGNUP") return;

        if (data.event === "FINISH" || data.event === "FINISH_ONLY_WABA") {
          const wabaId = data.data?.waba_id;
          if (wabaId) {
            pendingWabaId.current = wabaId;
            void completeConnection(wabaId);
          }
        } else if (data.event === "CANCEL") {
          setConnectStep("idle");
          toast.message(t("toasts.setupCancelled"));
        } else if (data.event === "ERROR") {
          setConnectStep("failed");
          setErrorMessage(data.data?.error_message ?? t("errors.metaSignupFailed"));
        }
      } catch {
        /* non-JSON message */
      }
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [completeConnection, t]);

  useEffect(() => {
    if (!isProvisioning || !connection) return;
    const interval = setInterval(() => {
      void onSettingsRefresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [connection, isProvisioning, onSettingsRefresh]);

  function launchEmbeddedSignup() {
    const configId = process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID;
    const solutionId = process.env.NEXT_PUBLIC_META_PARTNER_SOLUTION_ID;

    if (!configId || !solutionId) {
      toast.error(t("errors.signupNotConfigured"));
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error(t("errors.enterBusinessNumber"));
      return;
    }

    if (!window.FB) {
      toast.error(t("errors.sdkLoading"));
      return;
    }

    setConnectStep("meta");
    setErrorMessage(null);

    window.FB.login(
      () => {
        /* Twilio ISV flow uses postMessage listener, not this callback */
      },
      {
        config_id: configId,
        auth_type: "rerequest",
        response_type: "code",
        override_default_response_type: true,
        extras: {
          sessionInfoVersion: 3,
          setup: { solutionID: solutionId },
        },
      },
    );
  }

  function handleConnect() {
    startConnect(async () => {
      if (settings.sandboxMode) {
        await completeConnection();
        return;
      }
      launchEmbeddedSignup();
    });
  }

  function handleVerifyOtp() {
    startOtp(async () => {
      const res = await fetch("/api/integrations/whatsapp/complete", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, verificationCode: otpCode }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) {
        toast.error(json.error ?? t("errors.invalidCode"));
        return;
      }
      toast.success(t("toasts.phoneVerified"));
      setOtpCode("");
      setConnectStep("done");
      await onSettingsRefresh();
    });
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await disconnectWhatsAppForAgent(agentId);
      if (!result.success) {
        toast.error(result.error ?? t("errors.couldNotDisconnect"));
        return;
      }
      toast.success(t("toasts.disconnected"));
      setPhoneNumber("");
      setConnectStep("idle");
      await onSettingsRefresh();
    });
  }

  if (isConnected && connection) {
    return (
      <div className="space-y-4">
        {connection.isLegacy ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-caption text-amber-800">
            {t("legacyConnection")}
          </div>
        ) : null}

        <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
          <div className="flex items-start gap-3">
            <Image
              src="/svg/whatsapp-icon.svg"
              alt=""
              width={28}
              height={28}
              className="mt-0.5 size-7 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-medium text-ink">{t("connected")}</p>
              <p className="mt-0.5 font-mono text-body-sm text-muted">{connection.twilioNumber}</p>
              <p className="mt-2 text-caption text-muted-soft">
                {t("linked", { date: formatDate(connection.connectedAt) })}
              </p>
              {connection.qualityRating ? (
                <p className="mt-1 text-caption text-muted-soft">
                  {t("quality", { rating: connection.qualityRating })}
                  {connection.messagingLimit
                    ? t("messagingLimit", { limit: connection.messagingLimit })
                    : ""}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              {t("online")}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-9 w-full rounded-md text-red-600 hover:text-red-700 sm:w-auto"
          disabled={disconnectPending}
          onClick={handleDisconnect}
        >
          {disconnectPending ? (
            <AppIcon icon={LoaderIcon} size={16} className="mr-2 size-4 animate-spin" />
          ) : (
            <AppIcon icon={UnplugIcon} size={16} className="mr-2 size-4" />
          )}
          {t("disconnect")}
        </Button>
      </div>
    );
  }

  if (needsOtp || connectStep === "otp") {
    return (
      <div className="space-y-4">
        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <h2 className="text-title-sm font-medium text-ink">{t("verify.title")}</h2>
          <p className="mt-1 text-body-sm text-muted">
            {t("verify.description", { number: phoneNumber || connection?.twilioNumber || "" })}
          </p>
          <div className="mt-4">
            <ChatWidgetSettingRow label={t("verify.code")}>
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className={cn(chatWidgetFieldInputClass, "font-mono")}
                inputMode="numeric"
              />
            </ChatWidgetSettingRow>
          </div>
          <Button
            type="button"
            className="btn-primary mt-4 h-10 rounded-md"
            disabled={otpPending || !otpCode.trim()}
            onClick={handleVerifyOtp}
          >
            {otpPending ? <AppIcon icon={LoaderIcon} size={16} className="mr-2 size-4 animate-spin" /> : null}
            {t("verify.submit")}
          </Button>
        </section>
      </div>
    );
  }

  if (isProvisioning) {
    return (
      <div className="space-y-4">
        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <h2 className="text-title-sm font-medium text-ink">{t("connecting.title")}</h2>
          <ul className="mt-4 space-y-2.5">
            <StepItem
              done={connectStep !== "meta" && connectStep !== "idle"}
              active={connectStep === "meta"}
              label={t("connecting.verifyWithMeta")}
            />
            <StepItem
              done={connection?.status === "ONLINE"}
              active={connectStep === "registering" || connection?.status === "CREATING"}
              label={t("connecting.registerSender")}
            />
            <StepItem
              done={connection?.status === "ONLINE"}
              active={connection?.status === "CREATING"}
              label={t("connecting.activateNumber")}
            />
          </ul>
          {connection?.statusMessage ? (
            <p className="mt-3 text-caption text-muted">{connection.statusMessage}</p>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!settings.connectAvailable ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-caption text-amber-800">
          {t("connectNotConfigured")}
        </div>
      ) : null}

      {connectStep === "failed" && errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-caption text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-hairline bg-canvas-soft">
            <Image src="/svg/whatsapp-icon.svg" alt="" width={24} height={24} className="size-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-title-sm font-medium text-ink">{t("setup.title")}</h2>
            <p className="mt-1 text-body-sm leading-relaxed text-muted">
              {t("setup.description")}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <ChatWidgetSettingRow
            label={t("setup.businessNumber")}
            description={t("setup.businessNumberDescription")}
          >
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+212612345678"
              className={cn(chatWidgetFieldInputClass, "font-mono")}
              autoComplete="tel"
            />
          </ChatWidgetSettingRow>
        </div>

        <Button
          type="button"
          className="btn-primary mt-4 h-10 w-full rounded-md sm:w-auto"
          disabled={connectPending || !phoneNumber.trim() || !settings.connectAvailable}
          onClick={handleConnect}
        >
          {connectPending ? (
            <>
              <AppIcon icon={LoaderIcon} size={16} className="mr-2 size-4 animate-spin" />
              {t("connecting.button")}
            </>
          ) : settings.sandboxMode ? (
            t("setup.connectSandbox")
          ) : (
            t("setup.connectWithWhatsApp")
          )}
        </Button>

        {settings.sandboxMode ? (
          <p className="mt-3 text-caption text-muted-soft">
            {t("setup.sandboxDescription")}
          </p>
        ) : (
          <p className="mt-3 text-caption text-muted-soft">
            {t("setup.verificationDescription")}
          </p>
        )}
      </section>
    </div>
  );
}
