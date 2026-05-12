"use server";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";

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
