"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CUSTOM_FORM_FIELD_TYPES,
  MAX_FORM_FIELDS,
  type CustomFormField,
  type CustomFormFieldType,
} from "@/lib/deploy/custom-form-action";
import { cn } from "@/lib/utils";

import { chatWidgetFieldInputClass } from "../deploy/chat-widget/ChatWidgetSettingRow";
import { emptyFormField } from "./custom-form-action-draft";

type CustomFormFieldsEditorProps = {
  fields: CustomFormField[];
  onChange: (fields: CustomFormField[]) => void;
};

const FIELD_TYPE_LABELS: Record<CustomFormFieldType, string> = {
  text: "Text",
  email: "Email",
  phone: "Phone",
  textarea: "Long text",
  select: "Dropdown",
};

export function CustomFormFieldsEditor({ fields, onChange }: CustomFormFieldsEditorProps) {
  function updateField(index: number, patch: Partial<CustomFormField>) {
    const next = [...fields];
    const current = next[index];
    if (!current) return;

    if (patch.type && patch.type !== current.type) {
      next[index] = emptyFormField(patch.type);
      next[index].label = current.label;
      next[index].required = current.required;
      onChange(next);
      return;
    }

    next[index] = { ...current, ...patch } as CustomFormField;
    onChange(next);
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function addField() {
    if (fields.length >= MAX_FORM_FIELDS) return;
    onChange([...fields, emptyFormField()]);
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-body-sm text-ink">Fields</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-body-sm text-ink hover:bg-canvas-soft"
          onClick={addField}
          disabled={fields.length >= MAX_FORM_FIELDS}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add field
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-body-sm text-muted-soft">No fields yet. Add one to get started.</p>
      ) : null}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="space-y-2 rounded-xl border border-hairline bg-surface-strong p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-caption text-muted">Field {index + 1}</span>
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted hover:text-ink"
                onClick={() => moveField(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted hover:text-ink"
                onClick={() => moveField(index, 1)}
                disabled={index === fields.length - 1}
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted hover:text-destructive"
                onClick={() => removeField(index)}
                aria-label="Remove field"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <div>
              <Label className="text-caption text-muted">Type</Label>
              <select
                value={field.type}
                onChange={(e) =>
                  updateField(index, { type: e.target.value as CustomFormFieldType })
                }
                className={cn(chatWidgetFieldInputClass, "mt-1 w-full")}
              >
                {CUSTOM_FORM_FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {FIELD_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-caption text-muted">Label</Label>
              <Input
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                className={cn(chatWidgetFieldInputClass, "mt-1")}
                placeholder="e.g. Email address"
              />
            </div>
            <div>
              <Label className="text-caption text-muted">Placeholder (optional)</Label>
              <Input
                value={field.placeholder ?? ""}
                onChange={(e) =>
                  updateField(index, {
                    placeholder: e.target.value || undefined,
                  })
                }
                className={cn(chatWidgetFieldInputClass, "mt-1")}
              />
            </div>
            {field.type === "select" ? (
              <div>
                <Label className="text-caption text-muted">Options (one per line)</Label>
                <textarea
                  value={(field.options ?? []).join("\n")}
                  onChange={(e) => {
                    const options = e.target.value
                      .split("\n")
                      .map((o) => o.trim())
                      .filter(Boolean);
                    updateField(index, { options });
                  }}
                  rows={3}
                  className={cn(
                    chatWidgetFieldInputClass,
                    "mt-1 w-full resize-y min-h-[72px]",
                  )}
                />
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Label htmlFor={`required-${field.id}`} className="text-body-sm text-ink">
                Required
              </Label>
              <Switch
                id={`required-${field.id}`}
                checked={field.required}
                onCheckedChange={(required) => updateField(index, { required })}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
