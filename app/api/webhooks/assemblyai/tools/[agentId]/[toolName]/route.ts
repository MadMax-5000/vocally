import { NextResponse } from "next/server";

import { getAssemblyAiToolSecret } from "@/lib/assemblyai/env";
import { dispatchAssemblyAiTool } from "@/lib/assemblyai/tool-dispatch";
import { logServerWarning } from "@/lib/logger";

function extractBearer(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function handleToolRequest(
  req: Request,
  agentId: string,
  toolName: string,
): Promise<Response> {
  const secret = getAssemblyAiToolSecret();
  if (!secret) {
    return NextResponse.json({ error: "Tool secret not configured" }, { status: 401 });
  }

  const provided = extractBearer(req.headers.get("authorization"));
  if (!provided || !timingSafeEqualString(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let args: Record<string, unknown> = {};
  const url = new URL(req.url);
  url.searchParams.forEach((value, key) => {
    args[key] = value;
  });

  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as unknown;
      if (body && typeof body === "object" && !Array.isArray(body)) {
        args = { ...args, ...(body as Record<string, unknown>) };
      }
    }
  }

  const result = await dispatchAssemblyAiTool({ agentId, toolName, args });
  return new NextResponse(result, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(
  req: Request,
  { params }: { params: { agentId: string; toolName: string } },
) {
  try {
    return await handleToolRequest(req, params.agentId, params.toolName);
  } catch (error) {
    logServerWarning("[AssemblyAI Tool] Dispatch failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Tool execution failed" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { agentId: string; toolName: string } },
) {
  return handleToolRequest(req, params.agentId, params.toolName);
}
