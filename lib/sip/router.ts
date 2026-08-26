import { prisma } from "@/lib/db/prisma";
import { logServerWarning } from "@/lib/logger";

// ponytail: Maps DID → org/agent for per-tenant call routing.
// PBXme forwards calls to Vapi BYO SIP; the Vapi webhook resolves
// the DID to the correct org/agent.

export type RouteResult = {
  orgId: string;
  agentId: string;
  vapiPhoneNumberId: string | null;
  assistantId: string | null;
};

/**
 * Resolve an inbound DID to the owning org + agent.
 * Called from the Vapi assistant-request webhook when a call arrives on
 * a PBXme number forwarded to Vapi.
 */
export async function resolveDidRoute(e164: string): Promise<RouteResult | null> {
  const mapping = await prisma.twilioPhoneNumber.findUnique({
    where: { twilioNumber: e164 },
    select: {
      orgId: true,
      agentId: true,
      vapiPhoneNumberId: true,
      isActive: true,
    },
  });

  if (!mapping || !mapping.isActive) return null;

  return {
    orgId: mapping.orgId,
    agentId: mapping.agentId ?? "",
    vapiPhoneNumberId: mapping.vapiPhoneNumberId,
    assistantId: null,
  };
}

/**
 * Update routing for a DID.
 * With PBXme, routing is handled by forwarding the DID to Vapi.
 * This function logs the routing intent for debugging.
 */
export async function updateRouting(didE164: string): Promise<void> {
  logServerWarning("[SIP Router] Routing updated", {
    did: didE164,
    note: "Routing resolved at webhook time via resolveDidRoute()",
  });
}

/**
 * Get all active DIDs for an org (for dashboard display).
 */
export async function getOrgDids(orgId: string) {
  return prisma.twilioPhoneNumber.findMany({
    where: { orgId, isActive: true },
    select: {
      twilioNumber: true,
      didwwNumberId: true,
      customerNumber: true,
      forwardingVerifiedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
