import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  DEMO_TEST_RATE_LIMIT,
  DEMO_TEST_RATE_WINDOW_MS,
  MAX_AGENT_TEST_PROMPT_LENGTH,
} from "@/lib/agent-tests/constants";
import { runAgentTestQuestion } from "@/lib/agent-tests/run-question";
import { prisma } from "@/lib/db/prisma";
import { logServerWarning } from "@/lib/logger";

const runSchema = z.object({
  question: z.string().trim().min(1).max(MAX_AGENT_TEST_PROMPT_LENGTH),
});

const hitsByIp = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function allowRun(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - DEMO_TEST_RATE_WINDOW_MS;
  const prior = (hitsByIp.get(ip) ?? []).filter((ts) => ts > windowStart);
  if (prior.length >= DEMO_TEST_RATE_LIMIT) {
    hitsByIp.set(ip, prior);
    return false;
  }
  prior.push(now);
  hitsByIp.set(ip, prior);
  return true;
}

async function loadDemoAgent() {
  const agentId = process.env.DEMO_AGENT_ID?.trim();
  if (!agentId) return null;

  return prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      orgId: true,
      status: true,
      visibility: true,
      channels: {
        where: { channel: "WEB_CHAT" },
        select: { enabled: true },
      },
    },
  });
}

function isDemoReady(
  agent: Awaited<ReturnType<typeof loadDemoAgent>>,
): agent is NonNullable<Awaited<ReturnType<typeof loadDemoAgent>>> {
  if (!agent) return false;
  if (agent.visibility !== "PUBLIC" || agent.status !== "ACTIVE") return false;
  const webChat = agent.channels[0];
  return !!webChat?.enabled;
}

export async function GET() {
  try {
    const agent = await loadDemoAgent();
    return NextResponse.json({
      success: true,
      data: { available: isDemoReady(agent) },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: { available: false },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!allowRun(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many demo tests. Try again shortly." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = runSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    const agent = await loadDemoAgent();
    if (!isDemoReady(agent)) {
      return NextResponse.json(
        { success: false, error: "Demo is unavailable", code: "DEMO_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const result = await runAgentTestQuestion({
      orgId: agent.orgId,
      agentId: agent.id,
      prompt: parsed.data.question,
      previewUserFallback: "Floyd Miles",
    });

    return NextResponse.json({
      success: true,
      data: {
        response: result.response,
        passed: result.passed,
        judgeReason: result.judgeReason,
        testedAs: result.testedAs,
        status: result.status,
      },
    });
  } catch (err) {
    logServerWarning("demo_test_run_failed", {
      errorName: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
