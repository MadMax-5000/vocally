"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
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

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(d));
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
        setErrorMessage(json.error ?? "Could not connect WhatsApp");
        toast.error(json.error ?? "Could not connect");
        return;
      }

      if (json.data?.needsOtp || json.data?.status === "VERIFYING_OTP") {
        setConnectStep("otp");
        await onSettingsRefresh();
        return;
      }

      if (json.data?.status === "ONLINE") {
        setConnectStep("done");
        toast.success("WhatsApp connected");
        await onSettingsRefresh();
        return;
      }

      setConnectStep("registering");
      await onSettingsRefresh();
    },
    [agentId, onSettingsRefresh, phoneNumber],
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
          toast.message("WhatsApp setup cancelled");
        } else if (data.event === "ERROR") {
          setConnectStep("failed");
          setErrorMessage(data.data?.error_message ?? "Meta signup failed");
        }
      } catch {
        /* non-JSON message */
      }
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [completeConnection]);

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
      toast.error("WhatsApp signup is not configured on this deployment.");
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error("Enter your WhatsApp Business phone number first.");
      return;
    }

    if (!window.FB) {
      toast.error("Facebook SDK is still loading. Try again in a moment.");
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
        toast.error(json.error ?? "Invalid code");
        return;
      }
      toast.success("Phone verified");
      setOtpCode("");
      setConnectStep("done");
      await onSettingsRefresh();
    });
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await disconnectWhatsAppForAgent(agentId);
      if (!result.success) {
        toast.error(result.error ?? "Could not disconnect");
        return;
      }
      toast.success("WhatsApp disconnected");
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
            This connection uses the legacy setup. Reconnect to enable automatic webhook
            configuration and sender management.
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
              <p className="text-body-sm font-medium text-ink">Connected</p>
              <p className="mt-0.5 font-mono text-body-sm text-muted">{connection.twilioNumber}</p>
              <p className="mt-2 text-caption text-muted-soft">
                Linked {formatDate(connection.connectedAt)}
              </p>
              {connection.qualityRating ? (
                <p className="mt-1 text-caption text-muted-soft">
                  Quality: {connection.qualityRating}
                  {connection.messagingLimit ? ` · Limit: ${connection.messagingLimit}` : ""}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Online
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
          Disconnect
        </Button>
      </div>
    );
  }

  if (needsOtp || connectStep === "otp") {
    return (
      <div className="space-y-4">
        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <h2 className="text-title-sm font-medium text-ink">Verify your phone number</h2>
          <p className="mt-1 text-body-sm text-muted">
            Meta sent a one-time code to {phoneNumber || connection?.twilioNumber}. Enter it below.
          </p>
          <div className="mt-4">
            <ChatWidgetSettingRow label="Verification code">
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
            Verify code
          </Button>
        </section>
      </div>
    );
  }

  if (isProvisioning) {
    return (
      <div className="space-y-4">
        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <h2 className="text-title-sm font-medium text-ink">Connecting WhatsApp</h2>
          <ul className="mt-4 space-y-2.5">
            <StepItem
              done={connectStep !== "meta" && connectStep !== "idle"}
              active={connectStep === "meta"}
              label="Verify with Meta"
            />
            <StepItem
              done={connection?.status === "ONLINE"}
              active={connectStep === "registering" || connection?.status === "CREATING"}
              label="Register sender with Twilio"
            />
            <StepItem
              done={connection?.status === "ONLINE"}
              active={connection?.status === "CREATING"}
              label="Activate WhatsApp number"
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
          WhatsApp connect is not configured on this deployment. Contact your administrator.
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
            <h2 className="text-title-sm font-medium text-ink">Connect WhatsApp Business</h2>
            <p className="mt-1 text-body-sm leading-relaxed text-muted">
              Enter the phone number you use on WhatsApp Business. We&apos;ll verify ownership with
              Meta and configure messaging automatically.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <ChatWidgetSettingRow
            label="WhatsApp Business number"
            description="E.164 format, e.g. +212612345678"
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
              Connecting…
            </>
          ) : settings.sandboxMode ? (
            "Connect sandbox"
          ) : (
            "Connect with WhatsApp"
          )}
        </Button>

        {settings.sandboxMode ? (
          <p className="mt-3 text-caption text-muted-soft">
            Sandbox mode: uses the platform Twilio sandbox number for testing.
          </p>
        ) : (
          <p className="mt-3 text-caption text-muted-soft">
            You&apos;ll complete a short Meta verification popup to confirm business ownership.
          </p>
        )}
      </section>
    </div>
  );
}
