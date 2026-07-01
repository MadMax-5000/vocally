"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { InfoIcon, LoaderIcon } from "@/lib/icons/app-icons"

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
  const [greeting, setGreeting] = useState(
    `Hi, you've reached ${agentName}. How can I help you today?`,
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
      toast.success("Phone settings saved");
    } else {
      toast.error(result.error || "Failed to save settings");
    }
  }, [agentId, greeting, voicemailDetection, bargeIn, timeout, language, handoffPhone]);

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
        <h2 className="text-title-sm font-medium text-ink">Call behavior</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          Configure how the AI agent behaves during inbound phone calls.
        </p>

        <div className="mt-2 divide-y divide-hairline">
          <ChatWidgetSettingRow
            label="Greeting message"
            description="First message the caller hears when the call connects."
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
            label="Voicemail detection"
            description="Automatically detect voicemail and leave a pre-recorded message."
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
            label="Barge-in"
            description="Allow the caller to interrupt the AI mid-prompt. The AI stops and listens."
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
            label="Language"
            description="Auto-detect or set a fixed language for voice conversations."
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
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="ar">Arabic (MSA)</SelectItem>
                <SelectItem value="ary">Arabic (Darija)</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </ChatWidgetSettingRow>

          <ChatWidgetSettingRow
            label="Call timeout"
            description="Max seconds to wait for the caller to speak before the AI prompts again."
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
              <span className="text-caption text-muted-soft">seconds</span>
            </div>
          </ChatWidgetSettingRow>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-hairline pt-4">
          {hasChanges && (
            <p className="text-caption text-muted-soft">Unsaved changes</p>
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
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Human handoff</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          When a call escalates, Vocally transfers the caller to this number.
        </p>

        <div className="mt-2 divide-y divide-hairline">
          <ChatWidgetSettingRow
            label="Handoff phone number"
            description="E.164 format with country code (e.g. +212612345678). Required for phone escalations."
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
            Escalations are enabled on this agent but no handoff number is set. Calls
            cannot transfer to a human until you add one.
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-hairline pt-4">
          {hasChanges && (
            <p className="text-caption text-muted-soft">Unsaved changes</p>
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
                Saving…
              </>
            ) : (
              "Save changes"
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
            <p className="text-body-sm font-medium text-ink">Important</p>
            <p className="mt-1 text-caption text-muted leading-relaxed">
              Changes to call behavior settings take effect on the next inbound call.
              Active calls continue with their original configuration.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
