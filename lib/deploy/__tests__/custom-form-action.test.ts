import { describe, expect, it } from "vitest";

import {
  buildFormUiPayload,
  parseCustomFormActionConfig,
  resolveCustomFormAction,
  validateFormValues,
} from "@/lib/deploy/custom-form-action";

describe("parseCustomFormActionConfig", () => {
  it("parses a valid form config", () => {
    const parsed = parseCustomFormActionConfig({
      enabled: true,
      formId: "form_abc",
      title: "Contact us",
      fields: [
        {
          id: "email",
          type: "email",
          label: "Email",
          required: true,
        },
      ],
      showAfterUserMessages: 3,
      allowLlmTrigger: true,
    });

    expect(parsed.enabled).toBe(true);
    expect(parsed.formId).toBe("form_abc");
    expect(parsed.fields).toHaveLength(1);
    expect(parsed.showAfterUserMessages).toBe(3);
  });

  it("rejects invalid select without options", () => {
    const parsed = parseCustomFormActionConfig({
      fields: [{ id: "x", type: "select", label: "Pick", required: false }],
    });
    expect(parsed.fields).toBeUndefined();
  });
});

describe("resolveCustomFormAction", () => {
  it("returns defaults when channel missing", () => {
    const resolved = resolveCustomFormAction([]);
    expect(resolved.enabled).toBe(false);
    expect(resolved.title).toBeTruthy();
  });
});

describe("buildFormUiPayload", () => {
  it("returns null when disabled", () => {
    expect(
      buildFormUiPayload({
        enabled: false,
        formId: "f1",
        title: "T",
        description: "",
        submitLabel: "Submit",
        fields: [{ id: "a", type: "text", label: "A", required: true }],
        showAfterUserMessages: null,
        allowLlmTrigger: true,
      }),
    ).toBeNull();
  });

  it("builds ui when enabled with fields", () => {
    const ui = buildFormUiPayload({
      enabled: true,
      formId: "f1",
      title: "Contact",
      description: "Fill in",
      submitLabel: "Send",
      fields: [{ id: "name", type: "text", label: "Name", required: true }],
      showAfterUserMessages: null,
      allowLlmTrigger: true,
    });
    expect(ui?.type).toBe("form");
    expect(ui?.fields).toHaveLength(1);
  });
});

describe("validateFormValues", () => {
  const action = {
    enabled: true,
    formId: "f1",
    title: "Form",
    description: "",
    submitLabel: "Submit",
    fields: [
      { id: "email", type: "email" as const, label: "Email", required: true },
      { id: "note", type: "text" as const, label: "Note", required: false },
    ],
    showAfterUserMessages: null,
    allowLlmTrigger: true,
  };

  it("requires email when marked required", () => {
    const result = validateFormValues(action, { email: "" });
    expect(result.ok).toBe(false);
  });

  it("validates email format", () => {
    const result = validateFormValues(action, { email: "not-an-email" });
    expect(result.ok).toBe(false);
  });

  it("accepts valid submission", () => {
    const result = validateFormValues(action, {
      email: "a@example.com",
      note: "hello",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.email).toBe("a@example.com");
    }
  });
});
