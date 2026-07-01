"use client";

import { useCallback, useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { LoaderIcon } from "@/lib/icons/app-icons";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
  chatWidgetFieldTextareaClass,
} from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSettingRow";
import {
  getWhatsappSettings,
  updateWhatsappSettings,
} from "@/lib/actions/whatsapp-settings";
import type { WhatsappChannelConfig } from "@/lib/deploy/whatsapp-channel-config";
import { cn } from "@/lib/utils";

type Props = {
  agentId: string;
  whatsappEnabled: boolean;
};

const DAY_LABELS: Record<keyof NonNullable<WhatsappChannelConfig["businessHours"]>, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function WhatsAppSettingsTab({ agentId, whatsappEnabled }: Props) {
  const [config, setConfig] = useState<WhatsappChannelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const result = await getWhatsappSettings(agentId);
      if (result.success) {
        setConfig(result.data);
      }
      setIsLoading(false);
    }
    void load();
  }, [agentId]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  const handleSave = useCallback(async () => {
    if (!config) return;
    setIsSaving(true);
    const result = await updateWhatsappSettings(agentId, config);
    setIsSaving(false);
    if (result.success) {
      setHasChanges(false);
      toast.success("WhatsApp settings saved");
    } else {
      toast.error(result.error ?? "Failed to save");
    }
  }, [agentId, config]);

  if (!whatsappEnabled) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-caption text-amber-800">
        Enable WhatsApp to customize channel settings.
      </div>
    );
  }

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center py-12">
        <AppIcon icon={LoaderIcon} size={20} className="size-5 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Messages</h2>
        <div className="mt-4 space-y-4">
          <ChatWidgetSettingRow
            label="Welcome message"
            description="Prepended to the first reply in a new conversation."
          >
            <Textarea
              value={config.welcomeMessage ?? ""}
              onChange={(e) => {
                setConfig((c) => (c ? { ...c, welcomeMessage: e.target.value } : c));
                markChanged();
              }}
              rows={3}
              className={chatWidgetFieldTextareaClass}
              placeholder="Thanks for messaging us on WhatsApp!"
            />
          </ChatWidgetSettingRow>

          <ChatWidgetSettingRow
            label="Away message"
            description="Sent automatically outside business hours."
          >
            <Textarea
              value={config.awayMessage ?? ""}
              onChange={(e) => {
                setConfig((c) => (c ? { ...c, awayMessage: e.target.value } : c));
                markChanged();
              }}
              rows={3}
              className={chatWidgetFieldTextareaClass}
            />
          </ChatWidgetSettingRow>
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-title-sm font-medium text-ink">Business hours</h2>
            <p className="mt-0.5 text-caption text-muted">
              When disabled, the agent replies 24/7.
            </p>
          </div>
          <Switch
            checked={config.businessHoursEnabled ?? false}
            onCheckedChange={(checked) => {
              setConfig((c) => (c ? { ...c, businessHoursEnabled: checked } : c));
              markChanged();
            }}
          />
        </div>

        {config.businessHoursEnabled ? (
          <div className="mt-4 space-y-3">
            <ChatWidgetSettingRow label="Timezone">
              <input
                value={config.timezone ?? "Africa/Casablanca"}
                onChange={(e) => {
                  setConfig((c) => (c ? { ...c, timezone: e.target.value } : c));
                  markChanged();
                }}
                className={cn(chatWidgetFieldInputClass, "font-mono text-caption")}
              />
            </ChatWidgetSettingRow>

            {config.businessHours
              ? (
                  Object.keys(DAY_LABELS) as Array<
                    keyof NonNullable<WhatsappChannelConfig["businessHours"]>
                  >
                ).map((day) => {
                  const schedule = config.businessHours![day];
                  return (
                    <div
                      key={day}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-hairline bg-canvas-soft/40 px-3 py-2"
                    >
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={(enabled) => {
                          setConfig((c) =>
                            c?.businessHours
                              ? {
                                  ...c,
                                  businessHours: {
                                    ...c.businessHours,
                                    [day]: { ...schedule, enabled },
                                  },
                                }
                              : c,
                          );
                          markChanged();
                        }}
                      />
                      <span className="w-24 text-caption text-ink">{DAY_LABELS[day]}</span>
                      <input
                        type="time"
                        value={schedule.start}
                        disabled={!schedule.enabled}
                        onChange={(e) => {
                          setConfig((c) =>
                            c?.businessHours
                              ? {
                                  ...c,
                                  businessHours: {
                                    ...c.businessHours,
                                    [day]: { ...schedule, start: e.target.value },
                                  },
                                }
                              : c,
                          );
                          markChanged();
                        }}
                        className="rounded-md border border-hairline bg-surface-card px-2 py-1 text-caption"
                      />
                      <span className="text-caption text-muted">to</span>
                      <input
                        type="time"
                        value={schedule.end}
                        disabled={!schedule.enabled}
                        onChange={(e) => {
                          setConfig((c) =>
                            c?.businessHours
                              ? {
                                  ...c,
                                  businessHours: {
                                    ...c.businessHours,
                                    [day]: { ...schedule, end: e.target.value },
                                  },
                                }
                              : c,
                          );
                          markChanged();
                        }}
                        className="rounded-md border border-hairline bg-surface-card px-2 py-1 text-caption"
                      />
                    </div>
                  );
                })
              : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Profile</h2>
        <div className="mt-4 space-y-4">
          <ChatWidgetSettingRow label="About" description="Short line shown on your WhatsApp profile.">
            <input
              value={config.profileAbout ?? ""}
              onChange={(e) => {
                setConfig((c) => (c ? { ...c, profileAbout: e.target.value } : c));
                markChanged();
              }}
              maxLength={139}
              className={chatWidgetFieldInputClass}
            />
          </ChatWidgetSettingRow>
          <ChatWidgetSettingRow label="Description">
            <Textarea
              value={config.profileDescription ?? ""}
              onChange={(e) => {
                setConfig((c) => (c ? { ...c, profileDescription: e.target.value } : c));
                markChanged();
              }}
              rows={3}
              maxLength={512}
              className={chatWidgetFieldTextareaClass}
            />
          </ChatWidgetSettingRow>
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-body-sm font-medium text-ink">Human handoff</p>
            <p className="mt-0.5 text-caption text-muted">
              Allow customers to request a live agent on WhatsApp.
            </p>
          </div>
          <Switch
            checked={config.handoffEnabled ?? true}
            onCheckedChange={(checked) => {
              setConfig((c) => (c ? { ...c, handoffEnabled: checked } : c));
              markChanged();
            }}
          />
        </div>
      </section>

      <Button
        type="button"
        className="btn-primary h-10 rounded-md"
        disabled={!hasChanges || isSaving}
        onClick={handleSave}
      >
        {isSaving ? <AppIcon icon={LoaderIcon} size={16} className="mr-2 size-4 animate-spin" /> : null}
        Save settings
      </Button>
    </div>
  );
}
