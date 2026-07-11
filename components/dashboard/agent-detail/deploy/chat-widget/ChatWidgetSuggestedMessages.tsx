"use client";
import { useTranslations } from "next-intl";
import { AppIcon } from "@/components/ui/app-icon"
import { InfoIcon, PlusIcon, Trash2Icon } from "@/lib/icons/app-icons"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { ActionSheetToggleRow } from "@/components/dashboard/agent-detail/actions/ActionSheetShell";
import { chatWidgetFieldInputClass, ChatWidgetSettingRow } from "./ChatWidgetSettingRow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ChatWidgetSuggestedMessagesProps = {
  messages: string[];
  keepShowing: boolean;
  onMessagesChange: (messages: string[]) => void;
  onKeepShowingChange: (value: boolean) => void;
  variant?: "deploy" | "action-sheet";
};

export function ChatWidgetSuggestedMessages({
  messages,
  keepShowing,
  onMessagesChange,
  onKeepShowingChange,
  variant = "deploy",
}: ChatWidgetSuggestedMessagesProps) {
  const t = useTranslations("dashboard.deploy.generic");
  const isActionSheet = variant === "action-sheet";

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

  const inputClass = isActionSheet
    ? "h-10 flex-1 rounded-md border border-hairline bg-surface-card text-body-sm shadow-none focus-visible:border-hairline-strong focus-visible:ring-1 focus-visible:ring-hairline-strong/10"
    : cn(chatWidgetFieldInputClass, "flex-1");

  return (
    <div className={cn("space-y-3", !isActionSheet && "border-b border-hairline py-4")}>
      {!isActionSheet ? (
        <div className="flex items-center gap-1.5">
          <h4 className="text-body-sm text-muted">{t("suggestedMessages")}</h4>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted hover:text-ink"
                  aria-label={t("aboutSuggestedMessages")}
                >
                  <AppIcon icon={InfoIcon} className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-body-sm">
                {t("suggestedMessagesHint")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : null}

      {isActionSheet ? (
        <ActionSheetToggleRow
          label={t("keepSuggestedMessages")}
          description={t("keepSuggestedMessagesHint")}
        >
          <Switch checked={keepShowing} onCheckedChange={onKeepShowingChange} />
        </ActionSheetToggleRow>
      ) : (
        <ChatWidgetSettingRow
          variant="row"
          label={t("keepSuggestedMessages")}
          tooltip={t("keepSuggestedMessagesHint")}
          noBorder
        >
          <Switch checked={keepShowing} onCheckedChange={onKeepShowingChange} />
        </ChatWidgetSettingRow>
      )}

      {messages.length === 0 ? (
        <p className="py-2 text-center text-body-sm text-muted-soft">
          {t("noSuggestedMessages")}
        </p>
      ) : (
        <ul className="space-y-2">
          {messages.map((msg, index) => (
            <li key={index} className="flex items-center gap-2">
              <Input
                value={msg}
                onChange={(e) => updateMessage(index, e.target.value)}
                placeholder={t("suggestedMessage")}
                className={inputClass}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-muted hover:text-error"
                onClick={() => removeMessage(index)}
                aria-label={t("removeMessage")}
              >
                <AppIcon icon={Trash2Icon} className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        className={cn(
          "h-9 w-full text-body-sm font-medium shadow-none",
          isActionSheet
            ? "rounded-md border-hairline bg-surface-card hover:bg-canvas-soft"
            : "h-10 rounded-lg border-hairline bg-surface-card",
        )}
        onClick={addMessage}
      >
        <AppIcon icon={PlusIcon} className="mr-1.5 size-4" />
        {t("addSuggestedMessage")}
      </Button>
    </div>
  );
}
