import { Plan } from "@prisma/client";

const MIB = 1024 * 1024;

/** Storage quota for knowledge documents (RAG source bytes) per billing plan. */
export function getKnowledgeStorageQuotaBytes(plan: Plan): number {
  switch (plan) {
    case Plan.FREE:
      return 10 * MIB;
    case Plan.STARTER:
      return 50 * MIB;
    case Plan.PRO:
      return 500 * MIB;
    case Plan.ENTERPRISE:
      return 1024 * MIB;
    default:
      return 1 * MIB;
  }
}
