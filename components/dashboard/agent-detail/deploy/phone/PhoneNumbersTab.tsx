"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckCircle, LoaderIcon, PhoneIcon, PhoneForwarded, Trash2Icon, InfoIcon } from "@/lib/icons/app-icons"

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  connectPhoneNumber,
  disconnectPhoneNumber,
  importCarrierNumber,
  type PhoneConnectionSettings,
} from "@/lib/actions/phone-connection";

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
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState<string | null>(null);

  // Carrier import state
  const [carrierInput, setCarrierInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [carrierResult, setCarrierResult] = useState<{
    didNumber: string;
    carrierNumber: string;
  } | null>(null);

  const canProvision = settings.currentCount < settings.maxNumbers;

  const handleConnect = useCallback(async () => {
    if (!phoneEnabled || !canProvision) return;

    setIsProvisioning(true);
    setNewNumber(null);

    const result = await connectPhoneNumber(agentId);

    setIsProvisioning(false);

    if (result.success) {
      setNewNumber(result.data.number);
      toast.success(t("connected"));
      await onSettingsRefresh();
    } else {
      toast.error(result.error || t("connectFailed"));
    }
  }, [agentId, phoneEnabled, canProvision, onSettingsRefresh, t]);

  const handleDisconnect = useCallback(async (phoneNumber: string) => {
    setIsDisconnecting(phoneNumber);

    const result = await disconnectPhoneNumber(phoneNumber);

    setIsDisconnecting(null);

    if (result.success) {
      toast.success(t("disconnected"));
      setNewNumber(null);
      setCarrierResult(null);
      await onSettingsRefresh();
    } else {
      toast.error(result.error || t("disconnectFailed"));
    }
  }, [onSettingsRefresh, t]);

  const handleCarrierImport = useCallback(async () => {
    if (!phoneEnabled || !canProvision || !carrierInput.trim()) return;

    setIsImporting(true);
    setCarrierResult(null);

    const result = await importCarrierNumber(agentId, carrierInput.trim());

    setIsImporting(false);

    if (result.success) {
      setCarrierResult(result.data);
      setCarrierInput("");
      toast.success(t("connected"));
      await onSettingsRefresh();
    } else {
      toast.error(result.error || t("connectFailed"));
    }
  }, [agentId, phoneEnabled, canProvision, carrierInput, onSettingsRefresh, t]);

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

  const hasNumbers = settings.numbers.length > 0;

  return (
    <div className="space-y-4">
      {hasNumbers && (
        <section className="rounded-xl border border-hairline bg-surface-card p-4">
          <h2 className="text-title-sm font-medium text-ink">{t("yourNumbers")}</h2>
          <p className="mt-1 text-body-sm leading-relaxed text-muted">
            {t("yourNumbersDescription")}
          </p>

          <div className="mt-3 space-y-2">
            {settings.numbers.map((num) => (
              <div
                key={num.id}
                className="flex items-center justify-between rounded-lg border border-hairline bg-canvas-soft/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-emerald-50">
                    <AppIcon icon={PhoneForwarded} className="size-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-mono text-body-sm font-medium text-ink">
                      {num.number}
                    </p>
                    <p className="text-caption text-muted-soft">
                      {num.isActive ? tCommon("active") : t("inactive")}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-md text-red-600 hover:text-red-700"
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
            ))}
          </div>
        </section>
      )}

      {newNumber && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <AppIcon icon={CheckCircle} className="size-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-title-sm font-medium text-emerald-800">{t("numberProvisioned")}</p>
              <p className="mt-1 font-mono text-body-sm font-medium text-emerald-700">
                {newNumber}
              </p>
              <p className="mt-1 text-caption leading-relaxed text-emerald-600">
                {t("numberProvisionedDescription")}
              </p>
            </div>
          </div>
        </section>
      )}

      {carrierResult && (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
              <AppIcon icon={CheckCircle} className="size-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-title-sm font-medium text-blue-800">{t("carrierImportSuccess")}</p>
              <p className="mt-1 text-body-sm text-blue-700">
                {t("carrierImportSuccessDescription")}
              </p>

              <div className="mt-3 space-y-2">
                <div className="rounded-lg bg-white/60 p-3">
                  <p className="text-caption font-medium text-blue-600">{t("yourCarrierNumber")}</p>
                  <p className="font-mono text-body-sm font-medium text-blue-800">
                    {carrierResult.carrierNumber}
                  </p>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <p className="text-caption font-medium text-blue-600">{t("aiAgentNumber")}</p>
                  <p className="font-mono text-body-sm font-medium text-blue-800">
                    {carrierResult.didNumber}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-blue-100/50 p-3">
                <div className="flex items-start gap-2">
                  <AppIcon icon={InfoIcon} className="mt-0.5 size-4 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-caption font-medium text-blue-700">{t("forwardingInstructions")}</p>
                    <div className="mt-2 space-y-1.5">
                      {Object.entries(CARRIER_USSD).map(([carrier, template]) => {
                        const ussd = template.replace("{number}", carrierResult.didNumber);
                        return (
                          <div key={carrier} className="flex items-center gap-2">
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {canProvision ? (
        <div className="space-y-3">
          <section className="rounded-xl border border-hairline bg-surface-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-hairline bg-canvas-soft">
                <AppIcon icon={PhoneIcon} className="size-5 text-muted-soft" />
              </div>
              <div className="min-w-0">
                <h2 className="text-title-sm font-medium text-ink">
                  {t("addPhoneNumber")}
                </h2>
                <p className="mt-1 text-body-sm leading-relaxed text-muted">
                  {t("addPhoneNumberDescription")}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="button"
                className="btn-primary h-10 shrink-0 rounded-md px-6"
                disabled={isProvisioning || !canProvision}
                onClick={handleConnect}
              >
                {isProvisioning ? (
                  <>
                    <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
                    {t("provisioning")}
                  </>
                ) : (
                  t("provisionNumber")
                )}
              </Button>
            </div>

            <div className="mt-3 text-caption text-muted-soft">
              {t("provisionLimit", {
                current: settings.currentCount,
                max: settings.maxNumbers === Infinity ? t("unlimited") : settings.maxNumbers,
              })}
            </div>
          </section>{/* provision section */}

          <section className="rounded-xl border border-hairline bg-surface-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-hairline bg-canvas-soft">
                <AppIcon icon={PhoneForwarded} className="size-5 text-muted-soft" />
              </div>
              <div className="min-w-0">
                <h2 className="text-title-sm font-medium text-ink">
                  {t("importExisting")}
                </h2>
                <p className="mt-1 text-body-sm leading-relaxed text-muted">
                  {t("importExistingDescription")}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                type="tel"
                value={carrierInput}
                onChange={(e) => setCarrierInput(e.target.value)}
                placeholder="+2126XXXXXXXX"
                className="h-10 flex-1 font-mono"
                disabled={isImporting}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCarrierImport();
                }}
              />
              <Button
                type="button"
                className="btn-primary h-10 shrink-0 rounded-md px-6"
                disabled={isImporting || !carrierInput.trim() || !canProvision}
                onClick={handleCarrierImport}
              >
                {isImporting ? (
                  <>
                    <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
                    {t("importing")}
                  </>
                ) : (
                  t("connectCarrier")
                )}
              </Button>
            </div>

            <div className="mt-3 text-caption text-muted-soft">
              {t("importLimit", {
                current: settings.currentCount,
                max: settings.maxNumbers === Infinity ? t("unlimited") : settings.maxNumbers,
              })}
            </div>
          </section>
        </div>
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
