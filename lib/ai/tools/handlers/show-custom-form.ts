import type { ToolContext } from "@/lib/ai/tools/types";
import { buildFormUiPayload } from "@/lib/deploy/custom-form-action";
import type { ChatFormUi } from "@/lib/chat/form-ui";
import { prisma } from "@/lib/db/prisma";

export const customFormRequestStore = new Map<string, ChatFormUi>();

export async function handleShowCustomForm(
  _args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const action = ctx.customForm;
  if (!action?.enabled || !action.allowLlmTrigger) {
    return JSON.stringify({
      error: "custom_form_unavailable",
      message: "Custom form is not enabled for this agent.",
    });
  }

  const payload = buildFormUiPayload(action);
  if (!payload) {
    return JSON.stringify({
      error: "custom_form_not_configured",
      message: "Custom form has no fields configured.",
    });
  }

  if (ctx.agentId && ctx.sessionId) {
    const existing = await prisma.formSubmission.findUnique({
      where: {
        agentId_sessionId_formId: {
          agentId: ctx.agentId,
          sessionId: ctx.sessionId,
          formId: action.formId,
        },
      },
      select: { id: true },
    });
    if (existing) {
      return JSON.stringify({
        status: "already_submitted",
        message:
          "The customer already submitted this form in this conversation. Do not show it again.",
      });
    }
  }

  customFormRequestStore.set(ctx.sessionId, payload);

  return JSON.stringify({
    status: "form_shown",
    formId: action.formId,
    fieldCount: action.fields.length,
    message:
      "The form is now visible to the customer. Give a brief friendly intro; do not list every field.",
  });
}
