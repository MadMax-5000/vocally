"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChatFormUi } from "@/lib/chat/form-ui";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s().-]{6,30}$/;

type ChatInlineFormProps = {
  form: ChatFormUi;
  disabled?: boolean;
  preview?: boolean;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
};

export function ChatInlineForm({
  form,
  disabled = false,
  preview = false,
  onSubmit,
}: ChatInlineFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function setValue(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function validate(): Record<string, string> | null {
    const nextErrors: Record<string, string> = {};
    for (const field of form.fields) {
      const raw = values[field.id] ?? "";
      const trimmed = raw.trim();
      if (!trimmed) {
        if (field.required) {
          nextErrors[field.id] = `${field.label} is required`;
        }
        continue;
      }
      if (field.type === "email" && !EMAIL_RE.test(trimmed)) {
        nextErrors[field.id] = "Enter a valid email";
      }
      if (field.type === "phone" && !PHONE_RE.test(trimmed)) {
        nextErrors[field.id] = "Enter a valid phone number";
      }
      if (field.type === "select" && field.options && !field.options.includes(trimmed)) {
        nextErrors[field.id] = "Select an option";
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return null;
    }
    const normalized: Record<string, string> = {};
    for (const field of form.fields) {
      const trimmed = (values[field.id] ?? "").trim();
      if (trimmed) normalized[field.id] = trimmed;
    }
    return normalized;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (preview || disabled) return;
    const normalized = validate();
    if (!normalized) return;
    setSubmitting(true);
    try {
      await onSubmit(normalized);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "h-9 w-full rounded-md border border-hairline bg-surface-card px-3 text-body-sm text-ink shadow-none placeholder:text-muted-soft focus-visible:border-hairline-strong focus-visible:ring-1 focus-visible:ring-hairline-strong/10";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-hairline bg-surface-card p-3 shadow-sm"
      noValidate
    >
      <div>
        <p className="font-display text-body-md font-medium text-ink">{form.title}</p>
        {form.description ? (
          <p className="mt-0.5 text-body-sm text-muted">{form.description}</p>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {form.fields.map((field) => {
          const error = errors[field.id];
          const fieldId = `chat-form-${form.formId}-${field.id}`;

          return (
            <div key={field.id}>
              <Label htmlFor={fieldId} className="text-body-sm text-ink">
                {field.label}
                {field.required ? (
                  <span className="text-muted" aria-hidden>
                    {" "}
                    *
                  </span>
                ) : null}
              </Label>
              {field.type === "textarea" ? (
                <textarea
                  id={fieldId}
                  value={values[field.id] ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={disabled || submitting || preview}
                  rows={3}
                  className={cn(inputClass, "mt-1 min-h-[72px] resize-y py-2")}
                />
              ) : field.type === "select" ? (
                <Select
                  value={values[field.id] ?? ""}
                  onValueChange={(v) => setValue(field.id, v)}
                  disabled={disabled || submitting || preview}
                >
                  <SelectTrigger
                    id={fieldId}
                    className={cn(inputClass, "mt-1 w-full")}
                  >
                    <SelectValue placeholder={field.placeholder ?? "Select…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={fieldId}
                  type={
                    field.type === "email"
                      ? "email"
                      : field.type === "phone"
                        ? "tel"
                        : "text"
                  }
                  value={values[field.id] ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={disabled || submitting || preview}
                  className={cn(inputClass, "mt-1")}
                />
              )}
              {error ? (
                <p className="mt-1 text-caption text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <Button
        type="submit"
        disabled={disabled || submitting || preview}
        className="h-9 w-full bg-primary text-on-primary hover:bg-primary-active"
      >
        {submitting ? "Submitting…" : form.submitLabel}
      </Button>
    </form>
  );
}
