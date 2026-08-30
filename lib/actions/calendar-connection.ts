"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { listCalendlyEventTypes } from "@/lib/calendar/calendly/client";
import {
  disconnectCalendarForAgent,
  updateGoogleCalendarIdForAgent,
} from "@/lib/calendar/connect";
import { listGoogleCalendarsForConnection } from "@/lib/calendar/google/client";
import { toCalendarConnectionRecord } from "@/lib/calendar/service";
import { prisma } from "@/lib/db/prisma";
import { logServerError } from "@/lib/logger";
import { getOrgPrismaId } from "@/lib/server/organization";

function revalidateAgent(agentId: string) {
  revalidatePath(`/dashboard/agents/${agentId}`);
}

export type AgentCalendarConnectionView = {
  provider: "GOOGLE" | "CALENDLY";
  accountEmail: string | null;
  calendarId: string | null;
  connectedAt: string;
};

export async function getAgentCalendarConnection(agentId: string): Promise<
  | { success: true; data: AgentCalendarConnectionView | null }
  | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const connection = await prisma.calendarConnection.findFirst({
      where: { agentId, orgId },
      select: {
        provider: true,
        accountEmail: true,
        calendarId: true,
        connectedAt: true,
      },
    });
    if (!connection) return { success: true, data: null };
    return {
      success: true,
      data: {
        provider: connection.provider,
        accountEmail: connection.accountEmail,
        calendarId: connection.calendarId,
        connectedAt: connection.connectedAt.toISOString(),
      },
    };
  } catch {
    return { success: false, error: "Failed to load calendar connection" };
  }
}

export async function disconnectCalendar(agentId: string): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    await disconnectCalendarForAgent(agentId, orgId);
    revalidateAgent(agentId);
    return { success: true };
  } catch (err) {
    logServerError("calendar_disconnect_failed", {
      agentId,
      error: err instanceof Error ? err.message : "unknown",
    });
    return { success: false, error: "Failed to disconnect calendar" };
  }
}

export async function listConnectedGoogleCalendars(agentId: string): Promise<
  | { success: true; data: { id: string; summary: string; primary: boolean }[] }
  | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const connection = await prisma.calendarConnection.findFirst({
      where: { agentId, orgId, provider: "GOOGLE" },
    });
    if (!connection) return { success: false, error: "Google Calendar is not connected" };

    const data = await listGoogleCalendarsForConnection(
      toCalendarConnectionRecord(connection),
    );
    return { success: true, data };
  } catch (err) {
    logServerError("google_calendar_list_failed", {
      agentId,
      error: err instanceof Error ? err.message : "unknown",
    });
    return { success: false, error: "Failed to list Google calendars" };
  }
}

const updateCalendarIdSchema = z.object({
  calendarId: z.string().trim().min(1).max(320),
});

export async function updateConnectedGoogleCalendarId(
  agentId: string,
  input: z.infer<typeof updateCalendarIdSchema>,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const parsed = updateCalendarIdSchema.parse(input);
    await updateGoogleCalendarIdForAgent({
      agentId,
      orgId,
      calendarId: parsed.calendarId,
    });
    revalidateAgent(agentId);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update calendar",
    };
  }
}

export async function listConnectedCalendlyEventTypes(agentId: string): Promise<
  | { success: true; data: { uri: string; name: string; duration: number | null }[] }
  | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const connection = await prisma.calendarConnection.findFirst({
      where: { agentId, orgId, provider: "CALENDLY" },
    });
    if (!connection) return { success: false, error: "Calendly is not connected" };

    const data = await listCalendlyEventTypes(toCalendarConnectionRecord(connection));
    return { success: true, data };
  } catch (err) {
    logServerError("calendly_event_types_failed", {
      agentId,
      error: err instanceof Error ? err.message : "unknown",
    });
    return { success: false, error: "Failed to load Calendly event types" };
  }
}
