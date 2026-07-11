"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { ChevronDown, ChevronUp, PlusIcon, Trash2Icon } from "@/lib/icons/app-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  MAX_CUSTOM_BUTTONS,
  type CustomButtonItem,
  type CustomButtonKind,
} from "@/lib/deploy/custom-button-action";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

import {
  ActionSheetSection,
  ActionSheetToggleRow,
  actionSheetInputClass,
} from "./ActionSheetShell";

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
  const t = useTranslations("dashboard.actions");
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
    <ActionSheetSection
      title={t("sheet.customButton.buttons")}
      description={t("sheet.customButton.buttonsDescription")}
    >
      {buttons.length === 0 ? (
        <p className="text-body-sm text-muted-soft">{t("sheet.customButton.noButtons")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {buttons.map((btn, index) => (
            <li
              key={index}
              className="space-y-2 rounded-md border border-hairline bg-surface-card p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex rounded-md border border-hairline bg-canvas p-0.5">
                  {(["link", "message"] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => updateButton(index, { kind })}
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-caption transition-colors",
                        btn.kind === kind
                          ? "bg-surface-card font-medium text-ink shadow-sm"
                          : "text-muted hover:text-ink",
                      )}
                    >
                      {kind === "link"
                        ? t("sheet.customButton.openLink")
                        : t("sheet.customButton.sendMessage")}
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
                    aria-label={t("sheet.customButton.moveUp")}
                  >
                    <AppIcon icon={ChevronUp} size={16} className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted"
                    disabled={index === buttons.length - 1}
                    onClick={() => moveButton(index, 1)}
                    aria-label={t("sheet.customButton.moveDown")}
                  >
                    <AppIcon icon={ChevronDown} size={16} className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted hover:text-error"
                    onClick={() => removeButton(index)}
                    aria-label={t("sheet.customButton.removeButton")}
                  >
                    <AppIcon icon={Trash2Icon} size={16} className="size-4" />
                  </Button>
                </div>
              </div>

              <Input
                value={btn.label}
                onChange={(e) => updateButton(index, { label: e.target.value })}
                placeholder={t("sheet.customButton.buttonLabel")}
                className={actionSheetInputClass}
              />

              {btn.kind === "link" ? (
                <>
                  <Input
                    value={btn.href ?? ""}
                    onChange={(e) => updateButton(index, { href: e.target.value })}
                    placeholder={t("urlPlaceholder")}
                    className={actionSheetInputClass}
                  />
                  <ActionSheetToggleRow label={t("sheet.customButton.openNewTab")}>
                    <Switch
                      id={`custom-btn-new-tab-${index}`}
                      checked={btn.openInNewTab !== false}
                      onCheckedChange={(openInNewTab) =>
                        updateButton(index, { openInNewTab })
                      }
                    />
                  </ActionSheetToggleRow>
                </>
              ) : (
                <Input
                  value={btn.message ?? ""}
                  onChange={(e) => updateButton(index, { message: e.target.value })}
                  placeholder={t("sheet.customButton.messageSent")}
                  className={actionSheetInputClass}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        className="h-9 w-full rounded-md border-hairline bg-surface-card text-body-sm font-medium shadow-none hover:bg-canvas-soft"
        onClick={addButton}
        disabled={buttons.length >= MAX_CUSTOM_BUTTONS}
      >
        <AppIcon icon={PlusIcon} size={16} className="mr-1.5 size-4" />
        {t("sheet.customButton.addButton")}
      </Button>
    </ActionSheetSection>
  );
}
