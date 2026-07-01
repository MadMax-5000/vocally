"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { ChevronDown, ChevronUp, PlusIcon, Trash2Icon } from "@/lib/icons/app-icons";

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
  CUSTOM_FORM_FIELD_TYPES,
  MAX_FORM_FIELDS,
  type CustomFormField,
  type CustomFormFieldType,
} from "@/lib/deploy/custom-form-action";
import { cn } from "@/lib/utils";

import {
  ActionSheetField,
  ActionSheetSection,
  ActionSheetToggleRow,
  actionSheetInputClass,
  actionSheetTextareaClass,
} from "./ActionSheetShell";
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
    <ActionSheetSection
      title="Fields"
      description="Add inputs customers will fill in the form."
    >
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-body-sm font-medium text-ink hover:bg-canvas-soft"
          onClick={addField}
          disabled={fields.length >= MAX_FORM_FIELDS}
        >
          <AppIcon icon={PlusIcon} size={16} className="h-4 w-4" aria-hidden />
          Add field
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-body-sm text-muted-soft">No fields yet. Add one to get started.</p>
      ) : null}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="space-y-3 rounded-md border border-hairline bg-surface-card p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-body-sm font-medium text-ink">Field {index + 1}</span>
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
                <AppIcon icon={ChevronUp} size={16} className="h-4 w-4" />
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
                <AppIcon icon={ChevronDown} size={16} className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted hover:text-destructive"
                onClick={() => removeField(index)}
                aria-label="Remove field"
              >
                <AppIcon icon={Trash2Icon} size={16} className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <ActionSheetField label="Type">
              <Select
                value={field.type}
                onValueChange={(type) =>
                  updateField(index, { type: type as CustomFormFieldType })
                }
              >
                <SelectTrigger className={actionSheetInputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOM_FORM_FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {FIELD_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ActionSheetField>

            <ActionSheetField label="Label">
              <Input
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                className={actionSheetInputClass}
                placeholder="e.g. Email address"
              />
            </ActionSheetField>

            <ActionSheetField label="Placeholder" description="Optional">
              <Input
                value={field.placeholder ?? ""}
                onChange={(e) =>
                  updateField(index, {
                    placeholder: e.target.value || undefined,
                  })
                }
                className={actionSheetInputClass}
              />
            </ActionSheetField>

            {field.type === "select" ? (
              <ActionSheetField label="Options" description="One per line">
                <Textarea
                  value={(field.options ?? []).join("\n")}
                  onChange={(e) => {
                    const options = e.target.value
                      .split("\n")
                      .map((o) => o.trim())
                      .filter(Boolean);
                    updateField(index, { options });
                  }}
                  rows={3}
                  className={cn(actionSheetTextareaClass, "min-h-[72px]")}
                />
              </ActionSheetField>
            ) : null}

            <ActionSheetToggleRow label="Required">
              <Switch
                id={`required-${field.id}`}
                checked={field.required}
                onCheckedChange={(required) => updateField(index, { required })}
              />
            </ActionSheetToggleRow>
          </div>
        </div>
      ))}
    </ActionSheetSection>
  );
}
