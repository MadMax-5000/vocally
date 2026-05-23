"use client";

import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WIDGET_PRIMARY_COLOR_DEFAULT } from "@/lib/deploy/web-chat-config";
import { cn } from "@/lib/utils";

import { ChatWidgetColorField } from "./ChatWidgetColorField";
import { ChatWidgetSettingRow } from "./ChatWidgetSettingRow";
import type { ChatWidgetDraft } from "./chat-widget-draft";
import type { WebChatWidgetAppearance } from "@/lib/deploy/web-chat-config";

type ChatWidgetStyleTabProps = {
  draft: ChatWidgetDraft;
  onChange: (draft: ChatWidgetDraft) => void;
};

function AppearanceSegment({
  value,
  onChange,
}: {
  value: WebChatWidgetAppearance;
  onChange: (v: WebChatWidgetAppearance) => void;
}) {
  const options: { id: WebChatWidgetAppearance; label: string }[] = [
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
  ];

  return (
    <div className="inline-flex rounded-lg border border-hairline bg-canvas-soft p-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-body-sm transition-colors",
            value === opt.id
              ? "bg-surface-card font-medium text-ink shadow-sm"
              : "text-muted hover:text-ink",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function UploadStubField({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <ChatWidgetSettingRow label={label} description={description}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className="h-10 w-fit gap-1.5 rounded-lg border-hairline bg-surface-card text-body-sm"
      >
        <Upload className="size-3.5" />
        Upload
      </Button>
    </ChatWidgetSettingRow>
  );
}

export function ChatWidgetStyleTab({ draft, onChange }: ChatWidgetStyleTabProps) {
  const w = draft.widget;

  function patchWidget(partial: Partial<ChatWidgetDraft["widget"]>) {
    onChange({ ...draft, widget: { ...w, ...partial } });
  }

  return (
    <div>
      <ChatWidgetSettingRow label="Appearance" noBorder>
        <AppearanceSegment
          value={w.appearance}
          onChange={(appearance) => patchWidget({ appearance })}
        />
      </ChatWidgetSettingRow>

      <UploadStubField
        label="Profile picture"
        description="JPG, PNG, and SVG up to 1MB"
      />

      <UploadStubField label="Chat icon" description="JPG, PNG, and SVG up to 1MB" />

      <ChatWidgetSettingRow label="Primary color">
        <ChatWidgetColorField
          value={w.primaryColor}
          defaultValue={WIDGET_PRIMARY_COLOR_DEFAULT}
          onChange={(primaryColor) => patchWidget({ primaryColor })}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow label="Chat bubble button color" noBorder>
        <ChatWidgetColorField
          value={w.bubbleColor}
          defaultValue={w.primaryColor}
          onChange={(bubbleColor) => patchWidget({ bubbleColor })}
        />
      </ChatWidgetSettingRow>
    </div>
  );
}
