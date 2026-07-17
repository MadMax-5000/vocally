"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId, getOrgPlan } from "@/lib/server/organization";
import { ANALYTICS_ENABLED, QA_SCORING_ENABLED } from "@/lib/billing/plan-features";
import type { SessionStatus } from "@prisma/client";

export type DashboardStats = {
  totalSessions: number;
  activeSessions: number;
  resolvedByAI: number;
  aiResolutionRate: number;
  averageSentiment: number | null;
  averageDuration: number | null;
  totalDuration: number | null;
  averageQaScore: number | null;
  averageResponseTime: number | null;
  sessionsToday: number;
  dailySeries: {
    date: string;
    count: number;
    resolvedCount: number;
    avgDuration: number | null;
    totalDuration: number | null;
    avgQaScore: number | null;
    avgResponseTime: number | null;
    totalCost: number;
    avgCost: number;
    totalLlmCost: number;
    avgLlmCost: number;
  }[];
  sessionsByChannel: { channel: string; count: number }[];
};

export async function getDashboardStats(): Promise<
  { success: true; data: DashboardStats } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(startOfToday);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const [
      totalSessions,
      activeSessions,
      resolvedByAI,
      sessionsToday,
      sentimentAgg,
      callLogAgg,
      channelGroups,
    ] = await Promise.all([
      prisma.session.count({ where: { orgId } }),
      prisma.session.count({ where: { orgId, status: "ACTIVE" } }),
      prisma.session.count({ where: { orgId, resolvedByAI: true } }),
      prisma.session.count({ where: { orgId, createdAt: { gte: startOfToday } } }),
      prisma.session.aggregate({
        where: { orgId },
        _avg: { sentiment: true },
      }),
      prisma.callLog.aggregate({
        where: { orgId },
        _avg: { qaScore: true, duration: true, cost: true, llmCost: true },
        _sum: { duration: true, cost: true, llmCost: true },
      }),
      prisma.session.groupBy({
        by: ["channel"],
        where: { orgId },
        _count: true,
      }),
    ]);

    const [recentSessions, recentCallLogs] = await Promise.all([
      prisma.session.findMany({
        where: { orgId, createdAt: { gte: thirtyDaysAgo } },
        select: { id: true, createdAt: true, resolvedByAI: true },
      }),
      prisma.callLog.findMany({
        where: { orgId, createdAt: { gte: thirtyDaysAgo } },
        select: { duration: true, qaScore: true, cost: true, llmCost: true, createdAt: true },
      }),
    ]);

    const sessionsForResponse = await prisma.session.findMany({
      where: {
        orgId,
        createdAt: { gte: thirtyDaysAgo },
        messages: { some: {} },
      },
      select: {
        createdAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          take: 5,
          select: { role: true, createdAt: true },
        },
      },
      take: 500,
    });

    const dailyMap = new Map<
      string,
      {
        count: number;
        resolvedCount: number;
        durations: number[];
        totalDurations: number[];
        qaScores: number[];
        responseTimes: number[];
        costs: number[];
        llmCosts: number[];
      }
    >();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      dailyMap.set(d.toISOString().slice(0, 10), {
        count: 0,
        resolvedCount: 0,
        durations: [],
        totalDurations: [],
        qaScores: [],
        responseTimes: [],
        costs: [],
        llmCosts: [],
      });
    }

    for (const s of recentSessions) {
      const key = s.createdAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.count++;
        if (s.resolvedByAI) entry.resolvedCount++;
      }
    }

    for (const cl of recentCallLogs) {
      const key = cl.createdAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        if (cl.duration != null) {
          entry.durations.push(cl.duration);
          entry.totalDurations.push(cl.duration);
        }
        if (cl.qaScore != null) entry.qaScores.push(cl.qaScore);
        entry.costs.push(cl.cost);
        entry.llmCosts.push(cl.llmCost);
      }
    }

    for (const session of sessionsForResponse) {
      if (session.messages.length >= 2) {
        const firstUser = session.messages.find((m) => m.role === "USER");
        const firstResponse = session.messages.find(
          (m) => m.role !== "USER" && m.role !== "SYSTEM",
        );
        if (
          firstUser &&
          firstResponse &&
          firstResponse.createdAt > firstUser.createdAt
        ) {
          const key = session.createdAt.toISOString().slice(0, 10);
          const entry = dailyMap.get(key);
          if (entry) {
            entry.responseTimes.push(
              (firstResponse.createdAt.getTime() - firstUser.createdAt.getTime()) / 1000,
            );
          }
        }
      }
    }

    const dailySeries = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        count: data.count,
        resolvedCount: data.resolvedCount,
        avgDuration:
          data.durations.length > 0
            ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
            : null,
        totalDuration:
          data.totalDurations.length > 0
            ? data.totalDurations.reduce((a, b) => a + b, 0)
            : null,
        avgQaScore:
          data.qaScores.length > 0
            ? data.qaScores.reduce((a, b) => a + b, 0) / data.qaScores.length
            : null,
        avgResponseTime:
          data.responseTimes.length > 0
            ? data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length
            : null,
        totalCost:
          data.costs.length > 0
            ? data.costs.reduce((a, b) => a + b, 0)
            : 0,
        avgCost:
          data.costs.length > 0
            ? data.costs.reduce((a, b) => a + b, 0) / data.costs.length
            : 0,
        totalLlmCost:
          data.llmCosts.length > 0
            ? data.llmCosts.reduce((a, b) => a + b, 0)
            : 0,
        avgLlmCost:
          data.llmCosts.length > 0
            ? data.llmCosts.reduce((a, b) => a + b, 0) / data.llmCosts.length
            : 0,
      }));

    let totalResponseTime = 0;
    let responseTimeCount = 0;
    for (const entry of dailySeries) {
      if (entry.avgResponseTime != null) {
        totalResponseTime += entry.avgResponseTime;
        responseTimeCount++;
      }
    }

    return {
      success: true,
      data: {
        totalSessions,
        activeSessions,
        resolvedByAI,
        aiResolutionRate:
          totalSessions > 0 ? (resolvedByAI / totalSessions) * 100 : 0,
        averageSentiment: sentimentAgg._avg.sentiment ?? null,
        averageDuration: callLogAgg._avg.duration ?? null,
        totalDuration: callLogAgg._sum.duration ?? null,
        averageQaScore: callLogAgg._avg.qaScore ?? null,
        averageResponseTime:
          responseTimeCount > 0 ? totalResponseTime / responseTimeCount : null,
        sessionsToday,
        dailySeries,
        sessionsByChannel: channelGroups.map((g) => ({
          channel: g.channel,
          count: g._count,
        })),
      },
    };
  } catch (err) {
    const msg =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Failed to load dashboard stats";
    return { success: false, error: msg };
  }
}

/* ------------------------------------------------------------------ */
/*  Inbox                                                              */
/* ------------------------------------------------------------------ */

export type InboxSession = {
  id: string;
  channel: string;
  status: string;
  customerId: string | null;
  language: string;
  createdAt: Date;
  startedAt: Date;
  endedAt: Date | null;
  resolvedByAI: boolean;
  sentiment: number | null;
  summary: string | null;
  messageCount: number;
  agentName: string | null;
  agentAvatarUrl: string | null;
  duration: number | null;
  recordingUrl: string | null;
  qaScore: number | null;
  lastMessage: { content: string; createdAt: Date; role: string } | null;
};

export type InboxMessage = {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: Date;
};

export type ConversationTicketSummary = {
  id: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: Date;
};

export type ConversationDetail = {
  id: string;
  channel: string;
  status: string;
  customerId: string | null;
  language: string;
  createdAt: Date;
  startedAt: Date;
  endedAt: Date | null;
  resolvedByAI: boolean;
  sentiment: number | null;
  summary: string | null;
  escalatedAt: Date | null;
  escalatedReason: string | null;
  agentName: string | null;
  agentAvatarUrl: string | null;
  duration: number | null;
  recordingUrl: string | null;
  qaScore: number | null;
  messages: InboxMessage[];
  transcript: string | null;
  ticket: ConversationTicketSummary | null;
};

export async function getInboxSessions(): Promise<
  { success: true; data: InboxSession[] } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const sessions = await prisma.session.findMany({
      where: { orgId, messages: { some: {} } },
      select: {
        id: true,
        channel: true,
        status: true,
        customerId: true,
        language: true,
        createdAt: true,
        startedAt: true,
        endedAt: true,
        resolvedByAI: true,
        sentiment: true,
        summary: true,
        agent: {
          select: { name: true, avatarUrl: true },
        },
        callLog: {
          select: { duration: true, recordingUrl: true, qaScore: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, role: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const data: InboxSession[] = sessions.map((s) => ({
      id: s.id,
      channel: s.channel,
      status: s.status,
      customerId: s.customerId,
      language: s.language,
      createdAt: s.createdAt,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      resolvedByAI: s.resolvedByAI,
      sentiment: s.sentiment,
      summary: s.summary,
      messageCount: s._count.messages,
      agentName: s.agent?.name ?? null,
      agentAvatarUrl: s.agent?.avatarUrl ?? null,
      duration: s.callLog?.duration ?? null,
      recordingUrl: s.callLog?.recordingUrl ?? null,
      qaScore: s.callLog?.qaScore ?? null,
      lastMessage: s.messages[0] ?? null,
    }));

    return { success: true, data };
  } catch (err) {
    return { success: false, error: "Failed to load inbox sessions" };
  }
}

export async function getConversationDetail(
  sessionId: string,
): Promise<
  { success: true; data: ConversationDetail } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const session = await prisma.session.findFirst({
      where: { id: sessionId, orgId },
      select: {
        id: true,
        channel: true,
        status: true,
        customerId: true,
        language: true,
        createdAt: true,
        startedAt: true,
        endedAt: true,
        resolvedByAI: true,
        sentiment: true,
        summary: true,
        escalatedAt: true,
        escalatedReason: true,
        agent: {
          select: { name: true, avatarUrl: true },
        },
        callLog: {
          select: {
            duration: true,
            recordingUrl: true,
            qaScore: true,
            transcript: true,
          },
        },
        tickets: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            subject: true,
            priority: true,
            status: true,
            createdAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          select: { id: true, sessionId: true, role: true, content: true, createdAt: true },
        },
      },
    });

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    const latestTicket = session.tickets[0] ?? null;

    return {
      success: true,
      data: {
        id: session.id,
        channel: session.channel,
        status: session.status,
        customerId: session.customerId,
        language: session.language,
        createdAt: session.createdAt,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        resolvedByAI: session.resolvedByAI,
        sentiment: session.sentiment,
        summary: session.summary,
        escalatedAt: session.escalatedAt,
        escalatedReason: session.escalatedReason,
        agentName: session.agent?.name ?? null,
        agentAvatarUrl: session.agent?.avatarUrl ?? null,
        duration: session.callLog?.duration ?? null,
        recordingUrl: session.callLog?.recordingUrl ?? null,
        qaScore: session.callLog?.qaScore ?? null,
        messages: session.messages,
        transcript: session.callLog?.transcript ?? null,
        ticket: latestTicket,
      },
    };
  } catch (err) {
    return { success: false, error: "Failed to load conversation detail" };
  }
}

export async function getSessionMessages(
  sessionId: string,
): Promise<
  { success: true; data: InboxMessage[] } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const session = await prisma.session.findFirst({
      where: { id: sessionId, orgId },
      select: { id: true },
    });
    if (!session) return { success: false, error: "Session not found" };

    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { id: true, sessionId: true, role: true, content: true, createdAt: true },
    });

    return { success: true, data: messages };
  } catch (err) {
    return { success: false, error: "Failed to load messages" };
  }
}

export async function claimSession(
  sessionId: string,
): Promise<
  { success: true; data: { status: string } } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const result = await prisma.session.updateMany({
      where: { id: sessionId, orgId, status: "ESCALATED" },
      data: {
        status: "CLAIMED",
        claimedAt: new Date(),
        claimedById: userId,
      },
    });

    if (result.count === 0) {
      const session = await prisma.session.findFirst({
        where: { id: sessionId, orgId },
        select: { status: true },
      });
      if (!session) return { success: false, error: "Session not found" };
      return {
        success: false,
        error:
          session.status === "CLAIMED"
            ? "This conversation has already been claimed by another agent"
            : "This conversation cannot be claimed in its current state",
      };
    }

    await prisma.message.create({
      data: {
        sessionId,
        role: "SYSTEM",
        content: "Agent has joined the conversation.",
      },
    });

    return { success: true, data: { status: "CLAIMED" } };
  } catch (err) {
    return { success: false, error: "Failed to claim session" };
  }
}

/* ------------------------------------------------------------------ */
/*  Summary Update                                                      */
/* ------------------------------------------------------------------ */

export async function updateSessionSummary(
  sessionId: string,
  summary: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const result = await prisma.session.updateMany({
      where: { id: sessionId, orgId },
      data: { summary },
    });

    if (result.count === 0) {
      return { success: false, error: "Session not found" };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to update summary" };
  }
}

/* ------------------------------------------------------------------ */
/*  Per-Agent Analytics                                                 */
/* ------------------------------------------------------------------ */

export type AgentAnalytics = {
  totalSessions: number;
  aiResolutionRate: number;
  averageSentiment: number | null;
  averageDuration: number | null;
  averageQaScore: number | null;
  totalCost: number;
  totalLlmCost: number;
  sessionsByChannel: { channel: string; count: number }[];
  dailySeries: { date: string; count: number; resolvedCount: number }[];
};

export async function getAgentAnalytics(
  agentId: string,
): Promise<
  { success: true; data: AgentAnalytics } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const plan = await getOrgPlan();
    const qaEnabled = plan ? (QA_SCORING_ENABLED[plan as keyof typeof QA_SCORING_ENABLED] ?? false) : false;

    const now = new Date();
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

    const [totalSessions, resolvedByAI, sentimentAgg, callLogAgg, channelGroups] =
      await Promise.all([
        prisma.session.count({ where: { agentId } }),
        prisma.session.count({ where: { agentId, resolvedByAI: true } }),
        prisma.session.aggregate({
          where: { agentId },
          _avg: { sentiment: true },
        }),
        prisma.callLog.aggregate({
          where: { session: { agentId } },
          _avg: { duration: true, ...(qaEnabled ? { qaScore: true } : {}), cost: true, llmCost: true },
          _sum: { cost: true, llmCost: true },
        }),
        prisma.session.groupBy({
          by: ["channel"],
          where: { agentId },
          _count: true,
        }),
      ]);

    const recentSessions = await prisma.session.findMany({
      where: { agentId, createdAt: { gte: fourteenDaysAgo } },
      select: { id: true, createdAt: true, resolvedByAI: true },
    });

    const dailyMap = new Map<
      string,
      { count: number; resolvedCount: number }
    >();
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      dailyMap.set(d.toISOString().slice(0, 10), { count: 0, resolvedCount: 0 });
    }

    for (const s of recentSessions) {
      const key = s.createdAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.count++;
        if (s.resolvedByAI) entry.resolvedCount++;
      }
    }

    const dailySeries = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        count: data.count,
        resolvedCount: data.resolvedCount,
      }));

    return {
      success: true,
      data: {
        totalSessions,
        aiResolutionRate: totalSessions > 0 ? (resolvedByAI / totalSessions) * 100 : 0,
        averageSentiment: sentimentAgg._avg.sentiment ?? null,
        averageDuration: callLogAgg._avg.duration ?? null,
        averageQaScore: qaEnabled ? (callLogAgg._avg.qaScore ?? null) : null,
        totalCost: callLogAgg._sum.cost ?? 0,
        totalLlmCost: callLogAgg._sum.llmCost ?? 0,
        sessionsByChannel: channelGroups.map((g) => ({
          channel: g.channel,
          count: g._count,
        })),
        dailySeries,
      },
    };
  } catch (err) {
    const msg =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Failed to load agent analytics";
    return { success: false, error: msg };
  }
}

export async function getEscalationCount(): Promise<
  { success: true; data: number } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: true, data: 0 };

    const count = await prisma.session.count({
      where: { orgId, status: "ESCALATED" },
    });

    return { success: true, data: count };
  } catch {
    return { success: true, data: 0 };
  }
}

export async function sendMessage(
  sessionId: string,
  content: string,
): Promise<
  { success: true; data: InboxMessage } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const session = await prisma.session.findFirst({
      where: { id: sessionId, orgId },
      select: { id: true, status: true },
    });
    if (!session) return { success: false, error: "Session not found" };

    if (session.status !== "CLAIMED") {
      return {
        success: false,
        error:
          session.status === "ESCALATED"
            ? "Claim this conversation before replying"
            : "Cannot reply to a conversation in this state",
      };
    }

    const message = await prisma.message.create({
      data: {
        sessionId,
        role: "AGENT",
        content,
      },
    });

    return {
      success: true,
      data: {
        id: message.id,
        sessionId: message.sessionId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      },
    };
  } catch (err) {
    return { success: false, error: "Failed to send message" };
  }
}

/* ------------------------------------------------------------------ */
/*  Live Monitor                                                       */
/* ------------------------------------------------------------------ */

export type LiveSession = {
  id: string;
  channel: string;
  status: string;
  customerId: string | null;
  language: string;
  startedAt: Date;
  sentiment: number | null;
  agentName: string | null;
  duration: number | null;
  lastMessage: { content: string; createdAt: Date; role: string } | null;
  messageCount: number;
  resolvedByAI: boolean;
};

export async function getLiveSessions(): Promise<
  { success: true; data: LiveSession[] } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const liveStatuses: SessionStatus[] = ["ACTIVE", "WAITING", "BOT", "ESCALATED", "CLAIMED"];

    const sessions = await prisma.session.findMany({
      where: { orgId, status: { in: liveStatuses } },
      include: {
        agent: { select: { name: true } },
        callLog: { select: { duration: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, role: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: [{ status: "asc" }, { startedAt: "desc" }],
    });

    const data: LiveSession[] = sessions.map((s) => ({
      id: s.id,
      channel: s.channel,
      status: s.status,
      customerId: s.customerId,
      language: s.language,
      startedAt: s.startedAt,
      sentiment: s.sentiment,
      resolvedByAI: s.resolvedByAI,
      agentName: s.agent?.name ?? null,
      duration: s.callLog?.duration ?? null,
      lastMessage: s.messages[0] ?? null,
      messageCount: s._count.messages,
    }));

    return { success: true, data };
  } catch (err) {
    return { success: false, error: "Failed to load live sessions" };
  }
}

export async function checkAnalyticsEnabled(): Promise<{ enabled: boolean }> {
  const plan = await getOrgPlan();
  if (!plan) return { enabled: false };
  return { enabled: ANALYTICS_ENABLED[plan as keyof typeof ANALYTICS_ENABLED] ?? false };
}
