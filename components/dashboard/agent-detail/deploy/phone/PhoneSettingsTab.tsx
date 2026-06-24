"use client";

import { useState } from "react";
import { Info } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
  chatWidgetFieldTextareaClass,
} from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSettingRow";

type PhoneSettingsTabProps = {
  agentName: string;
};

export function PhoneSettingsTab({ agentName }: PhoneSettingsTabProps) {
  const [greeting, setGreeting] = useState(
    `Hi, you've reached ${agentName}. How can I help you today?`,
  );
  const [voicemailDetection, setVoicemailDetection] = useState(true);
  const [bargeIn, setBargeIn] = useState(true);
  const [timeout, setTimeout_] = useState(15);
  const [language, setLanguage] = useState("auto");

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
              onChange={(e) => setGreeting(e.target.value)}
              className={chatWidgetFieldTextareaClass}
              rows={2}
            />
          </ChatWidgetSettingRow>

          <ChatWidgetSettingRow
            label="Voicemail detection"
            description="Automatically detect voicemail and leave a pre-recorded message."
            variant="row"
          >
            <button
              type="button"
              role="switch"
              aria-checked={voicemailDetection}
              onClick={() => setVoicemailDetection(!voicemailDetection)}
              className={`relative inline-flex h-[18.4px] w-[32px] shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none ${
                voicemailDetection ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                  voicemailDetection ? "translate-x-[calc(100%-2px)]" : "translate-x-0"
                }`}
              />
            </button>
          </ChatWidgetSettingRow>

          <ChatWidgetSettingRow
            label="Barge-in"
            description="Allow the caller to interrupt the AI mid-prompt. The AI stops and listens."
            variant="row"
          >
            <button
              type="button"
              role="switch"
              aria-checked={bargeIn}
              onClick={() => setBargeIn(!bargeIn)}
              className={`relative inline-flex h-[18.4px] w-[32px] shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none ${
                bargeIn ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                  bargeIn ? "translate-x-[calc(100%-2px)]" : "translate-x-0"
                }`}
              />
            </button>
          </ChatWidgetSettingRow>

          <ChatWidgetSettingRow
            label="Language"
            description="Auto-detect or set a fixed language for voice conversations."
          >
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={chatWidgetFieldInputClass}
            >
              <option value="auto">Auto-detect</option>
              <option value="ar">Arabic (MSA)</option>
              <option value="ary">Arabic (Darija)</option>
              <option value="fr">French</option>
              <option value="en">English</option>
            </select>
          </ChatWidgetSettingRow>

          <ChatWidgetSettingRow
            label="Call timeout"
            description="Max seconds to wait for the caller to speak before the AI prompts again."
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={timeout}
                onChange={(e) => setTimeout_(Number(e.target.value))}
                min={5}
                max={120}
                className={chatWidgetFieldInputClass}
              />
              <span className="text-caption text-muted-soft">seconds</span>
            </div>
          </ChatWidgetSettingRow>
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <Info className="size-4 text-amber-600" />
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
