import type { Prisma } from "@prisma/client";

export const agentDetailInclude = {
  languages: true,
  channels: true,
  voices: true,
  knowledgeDocs: {
    include: {
      knowledgeDoc: { select: { id: true, title: true } },
    },
  },
  variables: true,
} satisfies Prisma.AgentInclude;

export type AgentDetailWithRelations = Prisma.AgentGetPayload<{
  include: typeof agentDetailInclude;
}>;

export type AgentDetailTabId =
  | "agent"
  | "workflow"
  | "preview"
  | "knowledge"
  | "analysis"
  | "tools"
  | "tests"
  | "widget"
  | "security"
  | "advanced";
