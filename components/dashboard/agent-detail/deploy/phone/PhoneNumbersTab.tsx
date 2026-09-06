"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckCircle, LoaderIcon, PhoneIcon, PhoneForwarded, Trash2Icon, InfoIcon } from "@/lib/icons/app-icons"

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  connectCarrierByoc,
  disconnectPhoneNumberV2,
  type PhoneConnectionSettings,
} from "@/lib/actions/phone-connection";
import { toMoroccanUssdDestination } from "@/lib/telephony/e164";

type PhoneNumbersTabProps = {
  agentId: string;
  phoneEnabled: boolean;
  settings: PhoneConnectionSettings;
  onSettingsRefresh: () => Promise<void>;
};

const CARRIER_USSD: Record<string, string> = {
  "Maroc Telecom": "*21*{number}#",
  Orange: "*21*{number}#",
  Inwi: "*21*{number}#",
};

export function PhoneNumbersTab({
  agentId,
  phoneEnabled,
  settings,
  onSettingsRefresh,
}: PhoneNumbersTabProps) {
  const t = useTranslations("dashboard.deploy.channels.phone");
  const tCommon = useTranslations("dashboard.deploy.channels.common");
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);
  const [carrierInput, setCarrierInput] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMode, setLastMode] = useState<"ussd" | "sip" | null>(null);

  const canProvision = settings.currentCount < settings.maxNumbers;
  const activeNumbers = settings.numbers.filter((n) => n.isActive);
  const hasNumbers = activeNumbers.length > 0;

  const handleDisconnect = useCallback(async (phoneNumber: string) => {
    setIsDisconnecting(phoneNumber);

    const result = await disconnectPhoneNumberV2(phoneNumber);

    setIsDisconnecting(null);

    if (result.success) {
      toast.success(t("disconnected"));
      setLastMode(null);
      await onSettingsRefresh();
    } else {
      toast.error(result.error || t("disconnectFailed"));
    }
  }, [onSettingsRefresh, t]);

  const handleConnectCarrier = useCallback(async () => {
    if (!phoneEnabled || !canProvision || isConnecting) return;
    const raw = carrierInput.trim();
    if (!raw) {
      toast.error(t("carrierRequired"));
      return;
    }

    setIsConnecting(true);
    const result = await connectCarrierByoc(agentId, raw);
    setIsConnecting(false);

    if (result.success) {
      setLastMode(result.data.mode);
      setCarrierInput("");
      toast.success(
        result.data.mode === "ussd" ? t("carrierImportSuccess") : t("sipByocSuccess"),
      );
      await onSettingsRefresh();
    } else {
      toast.error(result.error || t("connectFailed"));
    }
  }, [agentId, carrierInput, phoneEnabled, canProvision, isConnecting, onSettingsRefresh, t]);

  if (!phoneEnabled) {
    return (
      <div className="rounded-xl border border-hairline bg-surface-card p-6">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-canvas-soft">
            <AppIcon icon={PhoneIcon} className="size-6 text-muted-soft" />
          </div>
          <div>
            <p className="text-body-sm font-medium text-ink">{t("disabledTitle")}</p>
            <p className="mt-1 text-caption text-muted-soft">
              {t("disabledDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasNumbers && (
        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <h2 className="text-title-sm font-medium text-ink">{t("yourNumbers")}</h2>
          <p className="mt-1 text-body-sm leading-relaxed text-muted">
            {t("yourNumbersDescription")}
          </p>

          <div className="mt-3 space-y-3">
            {activeNumbers.map((num) => {
              const mode = num.connectionMode;
              const isSipByoc = mode === "sip";
              const isUssd = mode === "ussd";

              return (
                <div
                  key={num.id}
                  className="rounded-lg border border-hairline bg-canvas-soft/50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                        <AppIcon icon={PhoneForwarded} className="size-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0 space-y-2">
                        {num.customerNumber ? (
                          <>
                            <div>
                              <p className="text-caption text-muted-soft">{t("yourCarrierNumber")}</p>
                              <p className="font-mono text-body-sm font-medium text-ink">
                                {num.customerNumber}
                              </p>
                            </div>
                            {isUssd && (
                              <div>
                                <p className="text-caption text-muted-soft">{t("aiAgentNumber")}</p>
                                <p className="font-mono text-body-sm font-medium text-ink">
                                  {num.number}
                                </p>
                              </div>
                            )}
                            {isSipByoc && (
                              <div>
                                <p className="text-caption text-muted-soft">{t("sipDestinationLabel")}</p>
                                <p className="font-mono text-body-sm font-medium text-ink">
                                  {settings.assemblyAiSipUri}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <p className="text-caption text-muted-soft">{t("aiAgentNumber")}</p>
                            <p className="font-mono text-body-sm font-medium text-ink">
                              {num.number}
                            </p>
                          </div>
                        )}
                        <p className="text-caption text-muted-soft">
                          {num.isActive ? tCommon("active") : t("inactive")}
                          {isUssd
                            ? ` · ${num.forwardingVerifiedAt ? t("forwardingActive") : t("forwardingPending")}`
                            : ""}
                          {isSipByoc
                            ? ` · ${num.forwardingVerifiedAt ? t("sipByocActive") : t("sipByocPending")}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 shrink-0 rounded-md text-red-600 hover:text-red-700"
                      disabled={isDisconnecting === num.number}
                      onClick={() => handleDisconnect(num.number)}
                    >
                      {isDisconnecting === num.number ? (
                        <AppIcon icon={LoaderIcon} className="size-4 animate-spin" />
                      ) : (
                        <AppIcon icon={Trash2Icon} className="size-4" />
                      )}
                    </Button>
                  </div>

                  {isUssd && num.customerNumber && !num.forwardingVerifiedAt && (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/80 p-3">
                      <div className="flex items-start gap-2">
                        <AppIcon icon={InfoIcon} className="mt-0.5 size-4 shrink-0 text-blue-600" />
                        <div className="min-w-0">
                          <p className="text-caption font-medium text-blue-700">
                            {t("forwardingInstructions")}
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {Object.entries(CARRIER_USSD).map(([carrier, template]) => {
                              const ussd = template.replace(
                                "{number}",
                                toMoroccanUssdDestination(num.number),
                              );
                              return (
                                <div key={carrier} className="flex flex-wrap items-center gap-2">
                                  <span className="text-caption text-blue-600">{carrier}:</span>
                                  <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-caption font-medium text-blue-800">
                                    {ussd}
                                  </code>
                                </div>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-caption leading-relaxed text-blue-600">
                            {t("forwardingNote")}
                          </p>
                          <p className="mt-1 text-caption leading-relaxed text-blue-600">
                            {t("forwardingLandlineNote")}
                          </p>
                          <p className="mt-1 text-caption leading-relaxed text-blue-600">
                            {t("forwardingVerifyHint")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isSipByoc && !num.forwardingVerifiedAt && (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/80 p-3">
                      <div className="flex items-start gap-2">
                        <AppIcon icon={InfoIcon} className="mt-0.5 size-4 shrink-0 text-blue-600" />
                        <div className="min-w-0 space-y-1.5">
                          <p className="text-caption font-medium text-blue-700">
                            {t("sipByocInstructions")}
                          </p>
                          <p className="text-caption leading-relaxed text-blue-600">
                            {t("sipByocStep1")}
                          </p>
                          <p className="text-caption leading-relaxed text-blue-600">
                            {t("sipByocStep2", { sipUri: settings.assemblyAiSipUri })}
                          </p>
                          <p className="text-caption leading-relaxed text-blue-600">
                            {t("sipByocStep3")}
                          </p>
                          <code className="mt-1 block rounded bg-blue-100 px-1.5 py-1 font-mono text-caption font-medium text-blue-800">
                            {settings.assemblyAiSipUri}
                          </code>
                        </div>
                      </div>
                    </div>
                  )}

                  {num.customerNumber && num.forwardingVerifiedAt && (
                    <p className="mt-2 text-caption leading-relaxed text-emerald-700">
                      {isSipByoc ? t("sipByocActiveHint") : t("forwardingActiveHint")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {lastMode && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <AppIcon icon={CheckCircle} className="size-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-title-sm font-medium text-emerald-800">
                {lastMode === "ussd" ? t("carrierImportSuccess") : t("sipByocSuccess")}
              </p>
              <p className="mt-1 text-caption leading-relaxed text-emerald-600">
                {lastMode === "ussd"
                  ? t("carrierImportSuccessDescription")
                  : t("sipByocSuccessDescription")}
              </p>
            </div>
          </div>
        </section>
      )}

      {canProvision ? (
        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-hairline bg-canvas-soft">
              <AppIcon icon={PhoneIcon} className="size-5 text-muted-soft" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-title-sm font-medium text-ink">
                {t("importExisting")}
              </h2>
              <p className="mt-1 text-body-sm leading-relaxed text-muted">
                {t("importExistingDescription")}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("carrierPlaceholder")}
              value={carrierInput}
              onChange={(e) => setCarrierInput(e.target.value)}
              disabled={isConnecting}
              className="h-11 flex-1 rounded-md"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleConnectCarrier();
                }
              }}
            />
            <Button
              type="button"
              className="btn-primary h-11 shrink-0 rounded-md px-6 text-body-sm font-medium"
              disabled={isConnecting || !canProvision}
              onClick={() => void handleConnectCarrier()}
            >
              {isConnecting ? (
                <>
                  <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
                  {t("importing")}
                </>
              ) : (
                t("connectCarrier")
              )}
            </Button>
          </div>

          <p className="mt-3 text-caption text-muted-soft">
            {t("importLimit", {
              current: settings.currentCount,
              max: settings.maxNumbers === Infinity ? t("unlimited") : settings.maxNumbers,
            })}
          </p>
        </section>
      ) : settings.maxNumbers === 0 ? (
        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
              <AppIcon icon={PhoneIcon} className="size-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-ink">{t("freePlanTitle")}</p>
              <p className="mt-0.5 text-caption text-muted">
                {t("freePlanDescription")}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
              <AppIcon icon={PhoneIcon} className="size-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-ink">{t("planLimitReached")}</p>
              <p className="mt-0.5 text-caption text-muted">
                {t("planLimitReachedDescription")}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
