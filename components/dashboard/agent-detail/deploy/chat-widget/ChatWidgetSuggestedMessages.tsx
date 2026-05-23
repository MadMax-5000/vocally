"use client";

import { Info, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { chatWidgetFieldInputClass } from "./ChatWidgetSettingRow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ChatWidgetSuggestedMessagesProps = {
  messages: string[];
  keepShowing: boolean;
  onMessagesChange: (messages: string[]) => void;
  onKeepShowingChange: (value: boolean) => void;
};

export function ChatWidgetSuggestedMessages({
  messages,
  keepShowing,
  onMessagesChange,
  onKeepShowingChange,
}: ChatWidgetSuggestedMessagesProps) {
  function addMessage() {
    onMessagesChange([...messages, ""]);
  }

  function updateMessage(index: number, value: string) {
    const next = [...messages];
    next[index] = value;
    onMessagesChange(next);
  }

  function removeMessage(index: number) {
    onMessagesChange(messages.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3 border-b border-hairline py-4">
      <div className="flex items-center gap-1.5">
        <h4 className="text-body-sm text-muted">Suggested messages</h4>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted hover:text-ink"
                aria-label="About suggested messages"
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-body-sm">
              Quick-reply chips visitors can tap to start a conversation.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-strong px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-body-sm text-ink">Keep showing suggested messages</span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted hover:text-ink" aria-label="Info">
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-body-sm">
                Show suggested messages after the visitor sends their first message.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch checked={keepShowing} onCheckedChange={onKeepShowingChange} />
      </div>

      {messages.length === 0 ? (
        <p className="py-2 text-center text-body-sm text-muted-soft">
          No suggested messages yet
        </p>
      ) : (
        <ul className="space-y-2">
          {messages.map((msg, index) => (
            <li key={index} className="flex items-center gap-2">
              <Input
                value={msg}
                onChange={(e) => updateMessage(index, e.target.value)}
                placeholder="Suggested message"
                className={`${chatWidgetFieldInputClass} flex-1`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-muted hover:text-error"
                onClick={() => removeMessage(index)}
                aria-label="Remove message"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full rounded-lg border-hairline bg-surface-card text-body-sm"
        onClick={addMessage}
      >
        <Plus className="mr-1.5 size-4" />
        Add suggested message
      </Button>
    </div>
  );
}
