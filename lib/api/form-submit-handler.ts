import type { SessionStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { processMessage } from "@/lib/ai/process-message";
import type { ChatFormUi } from "@/lib/chat/form-ui";
import {
  formatFormSubmissionSummary,
  isCustomFormConfigured,
  resolveCustomFormAction,
  validateFormValues,
} from "@/lib/deploy/custom-form-action";
import { prisma } from "@/lib/db/prisma";
import {
  formatCustomFormEmailLines,
  notifyLeadCaptured,
} from "@/lib/leads/notify-lead";

type HandleFormSubmitInput = {
  orgId: string;
  agentId: string;
  sessionId: string;
  formId: string;
  values: Record<string, string>;
};

type ChatMessagePayload = {
  id: string;
  role: "USER" | "BOT" | "SYSTEM";
  content: string;
  createdAt: string;
  ui?: ChatFormUi;
};

type HandleFormSubmitSuccess = {
  ok: true;
  data: {
    sessionId: string;
    userMessage: ChatMessagePayload;
    systemMessage?: ChatMessagePayload;
    message: ChatMessagePayload;
    sessionStatus?: SessionStatus;
  };
};

type HandleFormSubmitFailure = {
  ok: false;
  error: { status: 400 | 404 | 409; message: string };
};

export type HandleFormSubmitResult = HandleFormSubmitSuccess | HandleFormSubmitFailure;

export async function handleFormSubmit(
  input: HandleFormSubmitInput,
): Promise<HandleFormSubmitResult> {
  const { orgId, agentId, sessionId, formId, values } = input;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { orgId: true, agentId: true },
  });

  if (!session || session.orgId !== orgId || session.agentId !== agentId) {
    return {
      ok: false,
      error: { status: 404, message: "Session not found" },
    };
  }

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    include: { channels: { where: { channel: "WEB_CHAT" } } },
  });

  if (!agent) {
    return {
      ok: false,
      error: { status: 404, message: "Agent not found" },
    };
  }

  const formAction = resolveCustomFormAction(agent.channels);
  if (!formAction.enabled || !isCustomFormConfigured(formAction)) {
    return {
      ok: false,
      error: { status: 400, message: "Custom form is not enabled" },
    };
  }

  if (formAction.formId !== formId) {
    return {
      ok: false,
      error: { status: 400, message: "Unknown form" },
    };
  }

  const validated = validateFormValues(formAction, values);
  if (!validated.ok) {
    return {
      ok: false,
      error: { status: 400, message: validated.error },
    };
  }

  try {
    await prisma.formSubmission.create({
      data: {
        orgId,
        agentId,
        sessionId,
        formId,
        values: validated.values as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        ok: false,
        error: { status: 409, message: "Form already submitted for this session" },
      };
    }
    throw err;
  }

  if (formAction.notifyEmail) {
    const detail: Record<string, string> = {};
    for (const field of formAction.fields) {
      const val = validated.values[field.id]?.trim();
      if (val) detail[field.label] = val;
    }
    void notifyLeadCaptured({
      notifyEmail: formAction.notifyEmail,
      subject: `New form submission for ${agent.name}`,
      lines: formatCustomFormEmailLines({
        agentName: agent.name,
        formTitle: formAction.title,
        detail,
      }),
    });
  }

  const summary = formatFormSubmissionSummary(formAction, validated.values);

  const systemMessage = await prisma.message.create({
    data: {
      sessionId,
      role: "SYSTEM",
      content: `Customer submitted form "${formAction.title}".`,
    },
  });

  const userMessage = await prisma.message.create({
    data: { sessionId, role: "USER", content: summary },
  });

  const processResult = await processMessage({
    orgId,
    agentId,
    sessionId,
    message: summary,
  });

  const botMessage = await prisma.message.create({
    data: { sessionId, role: "BOT", content: processResult.botContent },
  });

  const sessionRow = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });

  return {
    ok: true,
    data: {
      sessionId,
      systemMessage: {
        id: systemMessage.id,
        role: "SYSTEM",
        content: systemMessage.content,
        createdAt: systemMessage.createdAt.toISOString(),
      },
      userMessage: {
        id: userMessage.id,
        role: "USER",
        content: userMessage.content,
        createdAt: userMessage.createdAt.toISOString(),
      },
      message: {
        id: botMessage.id,
        role: "BOT",
        content: botMessage.content,
        createdAt: botMessage.createdAt.toISOString(),
        ...(processResult.formRequest ? { ui: processResult.formRequest } : {}),
      },
      ...(sessionRow?.status ? { sessionStatus: sessionRow.status } : {}),
    },
  };
}
