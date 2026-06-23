"use client";

import { ChatInlineForm } from "@/components/chat/ChatInlineForm";
import type { ChatFormUi } from "@/lib/chat/form-ui";
import { buildChatFormUi } from "@/lib/chat/form-ui";
import type { CustomFormField } from "@/lib/deploy/custom-form-action";

type CustomFormPreviewProps = {
  formId: string;
  title: string;
  description: string;
  submitLabel: string;
  fields: CustomFormField[];
};

export function CustomFormPreview({
  formId,
  title,
  description,
  submitLabel,
  fields,
}: CustomFormPreviewProps) {
  if (fields.length === 0) {
    return (
      <p className="py-4 text-center text-body-sm text-muted-soft">
        Add fields to see a preview.
      </p>
    );
  }

  const ui: ChatFormUi = buildChatFormUi({
    formId,
    title: title.trim() || "Form",
    description: description.trim() || undefined,
    submitLabel: submitLabel.trim() || "Submit",
    fields: fields.filter((f) => f.label.trim()),
  });

  return (
    <div className="mt-4">
      <p className="mb-2 text-caption font-medium uppercase tracking-wide text-muted">
        Preview
      </p>
      <div className="rounded-xl border border-hairline bg-canvas-soft p-3">
        <ChatInlineForm
          form={ui}
          preview
          onSubmit={() => {}}
        />
      </div>
    </div>
  );
}
