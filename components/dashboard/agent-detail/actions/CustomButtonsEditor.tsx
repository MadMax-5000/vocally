"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  MAX_CUSTOM_BUTTONS,
  type CustomButtonItem,
  type CustomButtonKind,
} from "@/lib/deploy/custom-button-action";
import { cn } from "@/lib/utils";

import { chatWidgetFieldInputClass } from "../deploy/chat-widget/ChatWidgetSettingRow";

type CustomButtonsEditorProps = {
  buttons: CustomButtonItem[];
  onChange: (buttons: CustomButtonItem[]) => void;
};

function emptyButton(kind: CustomButtonKind = "link"): CustomButtonItem {
  if (kind === "message") {
    return { label: "", kind: "message", message: "" };
  }
  return { label: "", kind: "link", href: "", openInNewTab: true };
}

export function CustomButtonsEditor({ buttons, onChange }: CustomButtonsEditorProps) {
  function updateButton(index: number, patch: Partial<CustomButtonItem>) {
    const next = [...buttons];
    const current = next[index];
    if (!current) return;

    if (patch.kind && patch.kind !== current.kind) {
      next[index] = { ...emptyButton(patch.kind), label: current.label };
      onChange(next);
      return;
    }

    next[index] = { ...current, ...patch } as CustomButtonItem;
    onChange(next);
  }

  function removeButton(index: number) {
    onChange(buttons.filter((_, i) => i !== index));
  }

  function addButton() {
    if (buttons.length >= MAX_CUSTOM_BUTTONS) return;
    onChange([...buttons, emptyButton()]);
  }

  function moveButton(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= buttons.length) return;
    const next = [...buttons];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  return (
    <div className="mt-4 space-y-3 border-t border-hairline pt-4">
      <div>
        <h4 className="text-body-sm text-ink">Buttons</h4>
        <p className="mt-1 text-caption text-muted-soft">
          Shown above the chat input on the widget and help page. Link buttons open a URL;
          message buttons send preset text as the user.
        </p>
      </div>

      {buttons.length === 0 ? (
        <p className="py-2 text-center text-body-sm text-muted-soft">No buttons yet</p>
      ) : (
        <ul className="space-y-3">
          {buttons.map((btn, index) => (
            <li
              key={index}
              className="space-y-2 rounded-lg border border-hairline bg-canvas-soft/50 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex rounded-lg border border-hairline bg-surface-card p-0.5">
                  {(["link", "message"] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => updateButton(index, { kind })}
                      className={cn(
                        "rounded-md px-2 py-0.5 text-caption transition-colors",
                        btn.kind === kind
                          ? "bg-surface-strong font-medium text-ink"
                          : "text-muted hover:text-ink",
                      )}
                    >
                      {kind === "link" ? "Open link" : "Send message"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted"
                    disabled={index === 0}
                    onClick={() => moveButton(index, -1)}
                    aria-label="Move up"
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted"
                    disabled={index === buttons.length - 1}
                    onClick={() => moveButton(index, 1)}
                    aria-label="Move down"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted hover:text-error"
                    onClick={() => removeButton(index)}
                    aria-label="Remove button"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <Input
                value={btn.label}
                onChange={(e) => updateButton(index, { label: e.target.value })}
                placeholder="Button label"
                className={chatWidgetFieldInputClass}
              />

              {btn.kind === "link" ? (
                <>
                  <Input
                    value={btn.href ?? ""}
                    onChange={(e) => updateButton(index, { href: e.target.value })}
                    placeholder="https://example.com"
                    className={chatWidgetFieldInputClass}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor={`custom-btn-new-tab-${index}`}
                      className="text-body-sm text-muted"
                    >
                      Open in new tab
                    </Label>
                    <Switch
                      id={`custom-btn-new-tab-${index}`}
                      checked={btn.openInNewTab !== false}
                      onCheckedChange={(openInNewTab) =>
                        updateButton(index, { openInNewTab })
                      }
                    />
                  </div>
                </>
              ) : (
                <Input
                  value={btn.message ?? ""}
                  onChange={(e) => updateButton(index, { message: e.target.value })}
                  placeholder="Message sent when clicked"
                  className={chatWidgetFieldInputClass}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full rounded-lg border-hairline bg-surface-card text-body-sm"
        onClick={addButton}
        disabled={buttons.length >= MAX_CUSTOM_BUTTONS}
      >
        <Plus className="mr-1.5 size-4" />
        Add button
      </Button>
    </div>
  );
}
