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
      <p className="text-body-sm text-muted-soft">Add fields to see a preview.</p>
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
    <section className="flex flex-col gap-3">
      <h3 className="text-title-sm text-ink">Preview</h3>
      <div className="rounded-md border border-hairline bg-surface-card p-3">
        <ChatInlineForm
          form={ui}
          preview
          onSubmit={() => {}}
        />
      </div>
    </section>
  );
}
