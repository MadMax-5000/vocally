import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { createCheckout } from "@/lib/billing/lemonsqueezy";
import { variantIdForPlan } from "@/lib/billing/plan-map";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]),
});

export async function POST(req: Request) {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID?.trim();
    if (!storeId) {
      return Response.json(
        { success: false, error: "Billing is not configured (missing store id)." },
        { status: 503 }
      );
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten().fieldErrors.plan?.[0] ?? "Invalid body" },
        { status: 400 }
      );
    }

    const variantId = variantIdForPlan(parsed.data.plan);
    if (!variantId) {
      return Response.json(
        { success: false, error: "This plan is not available for checkout." },
        { status: 400 }
      );
    }

    const origin = new URL(req.url).origin;
    const redirectUrl = `${origin}/${getRequestLocale(req.headers)}/dashboard`;

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
    const displayName =
      (user?.fullName?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()) ||
      null;

    const checkoutUrl = await createCheckout({
      variantId,
      storeId,
      clerkOrgId: orgId,
      clerkUserId: userId,
      redirectUrl,
      email: email ?? null,
      name: displayName,
    });

    return Response.json({ success: true, data: { checkoutUrl } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
