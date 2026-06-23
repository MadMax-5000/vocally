import type { CustomFormField, CustomFormFieldType } from "@/lib/deploy/custom-form-action";

export type ChatFormFieldUi = {
  id: string;
  type: CustomFormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
};

export type ChatFormUi = {
  type: "form";
  formId: string;
  title: string;
  description?: string;
  submitLabel: string;
  fields: ChatFormFieldUi[];
};

export function toChatFormFieldUi(field: CustomFormField): ChatFormFieldUi {
  return {
    id: field.id,
    type: field.type,
    label: field.label,
    ...(field.placeholder ? { placeholder: field.placeholder } : {}),
    required: field.required,
    ...(field.options?.length ? { options: field.options } : {}),
  };
}

export function buildChatFormUi(input: {
  formId: string;
  title: string;
  description?: string;
  submitLabel: string;
  fields: CustomFormField[];
}): ChatFormUi {
  return {
    type: "form",
    formId: input.formId,
    title: input.title,
    ...(input.description ? { description: input.description } : {}),
    submitLabel: input.submitLabel,
    fields: input.fields.map(toChatFormFieldUi),
  };
}
