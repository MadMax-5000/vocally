"use server";

import { z } from "zod";

import {
  listOrgLeadsFromDb,
  type LeadCaptureType,
  type OrgLeadRow,
} from "@/lib/leads/list-org-leads";
import { getOrgPrismaId } from "@/lib/server/organization";

const listOrgLeadsSchema = z.object({
  agentId: z.string().optional(),
  captureType: z.enum(["collect_leads", "custom_form"]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type { LeadCaptureType, OrgLeadRow };

export async function listOrgLeads(
  input?: z.infer<typeof listOrgLeadsSchema>,
): Promise<
  | { success: true; data: { rows: OrgLeadRow[]; total: number } }
  | { success: false; error: string }
> {
  try {
    const dbOrgId = await getOrgPrismaId();
    if (!dbOrgId) return { success: false, error: "Unauthorized" };

    const filters = listOrgLeadsSchema.parse(input ?? {});
    const result = await listOrgLeadsFromDb(dbOrgId, filters);
    return { success: true, data: result };
  } catch {
    return { success: false, error: "Failed to load leads" };
  }
}
