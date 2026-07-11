"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { InfoIcon, LoaderIcon } from "@/lib/icons/app-icons"

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ChatWidgetSettingRow,
  chatWidgetFieldTextareaClass,
} from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSettingRow";
import {
  getPhoneSettings,
  updatePhoneSettings,
} from "@/lib/actions/phone-settings";

type PhoneSettingsTabProps = {
  agentId: string;
  agentName: string;
};

export function PhoneSettingsTab({ agentId, agentName }: PhoneSettingsTabProps) {
  const t = useTranslations("dashboard.deploy.channels.phone");
  const tCommon = useTranslations("dashboard.deploy.channels.common");
  const [greeting, setGreeting] = useState(
    t("defaultGreeting", { agentName }),
  );
  const [voicemailDetection, setVoicemailDetection] = useState(true);
  const [bargeIn, setBargeIn] = useState(true);
  const [timeout, setTimeout_] = useState(15);
  const [language, setLanguage] = useState("auto");
  const [handoffPhone, setHandoffPhone] = useState("");
  const [escalationsEnabled, setEscalationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const result = await getPhoneSettings(agentId);
      if (result.success) {
        setGreeting(result.data.greeting);
        setVoicemailDetection(result.data.voicemailDetection);
        setBargeIn(result.data.bargeIn);
        setTimeout_(result.data.timeout);
        setLanguage(result.data.language);
        setHandoffPhone(result.data.handoffPhone);
        setEscalationsEnabled(result.data.escalationsEnabled);
      }
      setIsLoading(false);
    }
    load();
  }, [agentId]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const result = await updatePhoneSettings(agentId, {
      greeting,
      voicemailDetection,
      bargeIn,
      timeout,
      language,
      handoffPhone,
    });
    setIsSaving(false);
    if (result.success) {
      setHasChanges(false);
      toast.success(t("settingsSaved"));
    } else {
      toast.error(result.error || t("settingsSaveFailed"));
    }
  }, [agentId, greeting, voicemailDetection, bargeIn, timeout, language, handoffPhone, t]);

  const showHandoffWarning =
    escalationsEnabled && handoffPhone.trim().length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <AppIcon icon={LoaderIcon} className="size-5 animate-spin text-muted-soft" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">{t("callBehavior")}</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          {t("callBehaviorDescription")}
        </p>

        <div className="mt-2 divide-y divide-hairline">
          <ChatWidgetSettingRow
            label={t("greeting")}
            description={t("greetingDescription")}
          >
            <Textarea
              value={greeting}
              onChange={(e) => {
                setGreeting(e.target.value);
                markChanged();
              }}
              className={chatWidgetFieldTextareaClass}
              rows={2}
            />
          </ChatWidgetSettingRow>

          <ChatWidgetSettingRow
            label={t("voicemailDetection")}
            description={t("voicemailDescription")}
            variant="row"
          >
            <Switch
              checked={voicemailDetection}
              onCheckedChange={(v) => {
                setVoicemailDetection(v);
                markChanged();
              }}
            />
          </ChatWidgetSettingRow>

          <ChatWidgetSettingRow
            label={t("bargeIn")}
            description={t("bargeInDescription")}
            variant="row"
          >
            <Switch
              checked={bargeIn}
              onCheckedChange={(v) => {
                setBargeIn(v);
                markChanged();
              }}
            />
          </ChatWidgetSettingRow>

          <ChatWidgetSettingRow
            label={t("language")}
            description={t("languageDescription")}
          >
            <Select
              value={language}
              onValueChange={(v) => {
                setLanguage(v);
                markChanged();
              }}
            >
              <SelectTrigger className="h-10 w-full border-hairline-strong bg-surface-card text-body-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t("autoDetect")}</SelectItem>
                <SelectItem value="ar">{t("arabicMsa")}</SelectItem>
                <SelectItem value="ary">{t("arabicDarija")}</SelectItem>
                <SelectItem value="fr">{t("french")}</SelectItem>
                <SelectItem value="en">{t("english")}</SelectItem>
              </SelectContent>
            </Select>
          </ChatWidgetSettingRow>

          <ChatWidgetSettingRow
            label={t("callTimeout")}
            description={t("timeoutDescription")}
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={timeout}
                onChange={(e) => {
                  setTimeout_(Number(e.target.value));
                  markChanged();
                }}
                min={5}
                max={120}
                className="w-20"
              />
              <span className="text-caption text-muted-soft">{t("seconds")}</span>
            </div>
          </ChatWidgetSettingRow>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-hairline pt-4">
          {hasChanges && (
            <p className="text-caption text-muted-soft">{tCommon("unsavedChanges")}</p>
          )}
          <Button
            type="button"
            className="btn-primary h-9 rounded-md px-4"
            disabled={isSaving || !hasChanges}
            onClick={handleSave}
          >
            {isSaving ? (
              <>
                <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
                {tCommon("saving")}
              </>
            ) : (
              tCommon("saveChanges")
            )}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">{t("humanHandoff")}</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          {t("handoffDescription")}
        </p>

        <div className="mt-2 divide-y divide-hairline">
          <ChatWidgetSettingRow
            label={t("handoffNumber")}
            description={t("handoffNumberDescription")}
          >
            <Input
              value={handoffPhone}
              onChange={(e) => {
                setHandoffPhone(e.target.value);
                markChanged();
              }}
              placeholder="+212612345678"
              className="font-mono text-body-sm"
            />
          </ChatWidgetSettingRow>
        </div>

        {showHandoffWarning ? (
          <p className="mt-3 text-caption text-amber-700">
            {t("handoffWarning")}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-hairline pt-4">
          {hasChanges && (
            <p className="text-caption text-muted-soft">{tCommon("unsavedChanges")}</p>
          )}
          <Button
            type="button"
            className="btn-primary h-9 rounded-md px-4"
            disabled={isSaving || !hasChanges}
            onClick={handleSave}
          >
            {isSaving ? (
              <>
                <AppIcon icon={LoaderIcon} className="mr-2 size-4 animate-spin" />
                {tCommon("saving")}
              </>
            ) : (
              tCommon("saveChanges")
            )}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <AppIcon icon={InfoIcon} className="size-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-ink">{t("important")}</p>
            <p className="mt-1 text-caption text-muted leading-relaxed">
              {t("importantDescription")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
