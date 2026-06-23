import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { verifyMetaOAuthState, exchangeCodeForUserAccessToken, encryptPageAccessToken } from "@/lib/integrations/instagram/oauth";
import { getPageAccessToken, getPageInstagramBusinessAccountId, getUserPages } from "@/lib/integrations/instagram/graph";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return NextResponse.json({ success: false, error: "Missing code or state" }, { status: 400 });
    }

    const payload = verifyMetaOAuthState(state);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid state" }, { status: 400 });
    }

    const { agentId, orgId } = payload;

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    const userAccessToken = await exchangeCodeForUserAccessToken(code);
    const pages = await getUserPages(userAccessToken);
    if (pages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No Facebook Pages available for this user" },
        { status: 400 },
      );
    }

    // Prefer a page that is linked to an Instagram professional account.
    let selected: { id: string; name: string } | null = null;
    let selectedPat: string | null = null;

    for (const p of pages) {
      const pat = await getPageAccessToken(p.id, userAccessToken);
      const igBizId = await getPageInstagramBusinessAccountId(p.id, pat);
      if (igBizId) {
        selected = { id: p.id, name: p.name };
        selectedPat = pat;
        break;
      }
    }

    if (!selected || !selectedPat) {
      // Fall back to first page; some environments may not allow reading the ig linkage yet.
      const first = pages[0];
      selected = { id: first.id, name: first.name };
      selectedPat = await getPageAccessToken(first.id, userAccessToken);
    }

    const pageAccessTokenEnc = encryptPageAccessToken(selectedPat);

    await prisma.instagramConnection.upsert({
      where: { agentId },
      create: {
        orgId,
        agentId,
        pageId: selected.id,
        pageName: selected.name,
        pageAccessTokenEnc,
      },
      update: {
        pageId: selected.id,
        pageName: selected.name,
        pageAccessTokenEnc,
      },
    });

    // Redirect back to the manage page.
    return NextResponse.redirect(
      new URL(`/dashboard/agents/${agentId}/deploy/instagram`, url.origin),
    );
  } catch (err) {
    const msg =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Failed to connect Instagram";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

