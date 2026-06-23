import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import type { CustomFormField } from "@/lib/deploy/custom-form-action";
import {
  DEFAULT_FORM_TITLE,
  DEFAULT_SUBMIT_LABEL,
  MAX_FORM_FIELDS,
  resolveCustomFormAction,
} from "@/lib/deploy/custom-form-action";

export type CustomFormActionDraft = {
  enabled: boolean;
  formId: string;
  title: string;
  description: string;
  submitLabel: string;
  fields: CustomFormField[];
  showAfterUserMessages: number | null;
  allowLlmTrigger: boolean;
};

export function buildCustomFormActionDraft(
  agent: AgentDetailWithRelations,
): CustomFormActionDraft {
  const resolved = resolveCustomFormAction(agent.channels);
  return {
    enabled: resolved.enabled,
    formId: resolved.formId || `form_${Date.now().toString(36)}`,
    title: resolved.title || DEFAULT_FORM_TITLE,
    description: resolved.description,
    submitLabel: resolved.submitLabel || DEFAULT_SUBMIT_LABEL,
    fields: resolved.fields.map((f) => ({ ...f })),
    showAfterUserMessages: resolved.showAfterUserMessages,
    allowLlmTrigger: resolved.allowLlmTrigger,
  };
}

function fieldsEqual(a: CustomFormField[], b: CustomFormField[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((field, i) => {
    const other = b[i];
    return (
      field.id === other.id &&
      field.type === other.type &&
      field.label === other.label &&
      field.required === other.required &&
      (field.placeholder ?? "") === (other.placeholder ?? "") &&
      JSON.stringify(field.options ?? []) === JSON.stringify(other.options ?? [])
    );
  });
}

export function draftsEqual(a: CustomFormActionDraft, b: CustomFormActionDraft): boolean {
  return (
    a.enabled === b.enabled &&
    a.formId === b.formId &&
    a.title === b.title &&
    a.description === b.description &&
    a.submitLabel === b.submitLabel &&
    a.showAfterUserMessages === b.showAfterUserMessages &&
    a.allowLlmTrigger === b.allowLlmTrigger &&
    fieldsEqual(a.fields, b.fields)
  );
}

export function validateCustomFormDraft(draft: CustomFormActionDraft): string | null {
  if (!draft.enabled) return null;
  if (!draft.title.trim()) return "Form title is required";
  if (!draft.submitLabel.trim()) return "Submit button label is required";
  if (draft.fields.length === 0) return "Add at least one field";
  if (draft.fields.length > MAX_FORM_FIELDS) {
    return `Maximum ${MAX_FORM_FIELDS} fields allowed`;
  }
  const ids = new Set<string>();
  for (const field of draft.fields) {
    if (!field.label.trim()) return "Each field needs a label";
    if (!field.id.trim()) return "Each field needs an id";
    if (ids.has(field.id)) return "Field ids must be unique";
    ids.add(field.id);
    if (field.type === "select") {
      if (!field.options?.length) return "Select fields need at least one option";
    }
  }
  return null;
}

export function newFieldId(): string {
  return `field_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyFormField(type: CustomFormField["type"] = "text"): CustomFormField {
  const id = newFieldId();
  if (type === "select") {
    return {
      id,
      type,
      label: "",
      required: false,
      options: ["Option 1"],
    };
  }
  return { id, type, label: "", required: false };
}
