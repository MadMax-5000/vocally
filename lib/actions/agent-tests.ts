"use server";

import { AgentTestRunStatus } from "@prisma/client";
import { z } from "zod";

import {
  MAX_AGENT_TEST_PROMPT_LENGTH,
  MAX_AGENT_TEST_QUESTIONS,
} from "@/lib/agent-tests/constants";
import { runAgentTestQuestion } from "@/lib/agent-tests/run-question";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";

export type AgentTestQuestionRow = {
  id: string;
  prompt: string;
  sortOrder: number;
  latestRun: {
    status: AgentTestRunStatus;
    response: string | null;
    judgeReason: string | null;
    testedAs: string | null;
  } | null;
};

const promptSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_AGENT_TEST_PROMPT_LENGTH);

async function requireAgent(agentId: string) {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { ok: false as const, error: "Unauthorized" };

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true, orgId: true },
  });
  if (!agent) return { ok: false as const, error: "Agent not found" };

  return { ok: true as const, orgId: agent.orgId, agentId: agent.id };
}

export async function listAgentTestQuestions(agentId: string) {
  try {
    const access = await requireAgent(agentId);
    if (!access.ok) {
      return { success: false as const, error: access.error, data: [] as AgentTestQuestionRow[] };
    }

    const rows = await prisma.agentTestQuestion.findMany({
      where: { agentId: access.agentId, orgId: access.orgId },
      orderBy: { sortOrder: "asc" },
      include: {
        runs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            response: true,
            judgeReason: true,
            testedAs: true,
          },
        },
      },
    });

    const data: AgentTestQuestionRow[] = rows.map((row) => ({
      id: row.id,
      prompt: row.prompt,
      sortOrder: row.sortOrder,
      latestRun: row.runs[0]
        ? {
            status: row.runs[0].status,
            response: row.runs[0].response,
            judgeReason: row.runs[0].judgeReason,
            testedAs: row.runs[0].testedAs,
          }
        : null,
    }));

    return { success: true as const, data };
  } catch {
    return {
      success: false as const,
      error: "Failed to load tests",
      data: [] as AgentTestQuestionRow[],
    };
  }
}

export async function addAgentTestQuestion(agentId: string, prompt: string) {
  try {
    const access = await requireAgent(agentId);
    if (!access.ok) return { success: false as const, error: access.error };

    const validated = promptSchema.parse(prompt);

    const count = await prisma.agentTestQuestion.count({
      where: { agentId: access.agentId, orgId: access.orgId },
    });
    if (count >= MAX_AGENT_TEST_QUESTIONS) {
      return {
        success: false as const,
        error: `You can add up to ${MAX_AGENT_TEST_QUESTIONS} questions.`,
      };
    }

    const last = await prisma.agentTestQuestion.findFirst({
      where: { agentId: access.agentId, orgId: access.orgId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const created = await prisma.agentTestQuestion.create({
      data: {
        orgId: access.orgId,
        agentId: access.agentId,
        prompt: validated,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });

    return {
      success: true as const,
      data: {
        id: created.id,
        prompt: created.prompt,
        sortOrder: created.sortOrder,
        latestRun: null,
      } satisfies AgentTestQuestionRow,
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false as const,
        error: err.issues[0]?.message ?? "Invalid question",
      };
    }
    return { success: false as const, error: "Failed to add question" };
  }
}

export async function deleteAgentTestQuestion(questionId: string) {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false as const, error: "Unauthorized" };

    const row = await prisma.agentTestQuestion.findFirst({
      where: { id: questionId, orgId },
      select: { id: true },
    });
    if (!row) return { success: false as const, error: "Question not found" };

    await prisma.agentTestQuestion.delete({ where: { id: row.id } });
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to delete question" };
  }
}

export async function runAgentTestQuestionAction(questionId: string) {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false as const, error: "Unauthorized" };

    const question = await prisma.agentTestQuestion.findFirst({
      where: { id: questionId, orgId },
      select: { id: true, prompt: true, agentId: true, orgId: true },
    });
    if (!question) return { success: false as const, error: "Question not found" };

    const result = await runAgentTestQuestion({
      orgId: question.orgId,
      agentId: question.agentId,
      prompt: question.prompt,
      previewUserFallback: "Preview user",
    });

    const run = await prisma.agentTestRun.create({
      data: {
        orgId: question.orgId,
        agentId: question.agentId,
        questionId: question.id,
        status: result.status,
        response: result.response || null,
        judgeReason: result.judgeReason,
        testedAs: result.testedAs,
      },
    });

    return {
      success: true as const,
      data: {
        status: run.status,
        response: run.response,
        judgeReason: run.judgeReason,
        testedAs: run.testedAs,
      },
    };
  } catch {
    return { success: false as const, error: "Failed to run test" };
  }
}
