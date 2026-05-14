import crypto from "node:crypto";

import type { Plan } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { planFromVariantId } from "@/lib/billing/plan-map";

export const dynamic = "force-dynamic";

type LemonMeta = {
  event_name?: string;
  custom_data?: Record<string, unknown>;
};

type SubscriptionAttrs = {
  variant_id?: number | string;
  customer_id?: number | string;
  status?: string;
};

function clerkOrgIdFromMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const custom = (meta as LemonMeta).custom_data;
  if (!custom || typeof custom !== "object") return null;
  const v = custom.clerk_org_id;
  return typeof v === "string" && v.length > 0 ? v : null;
}

function parseSubscriptionPayload(body: unknown): {
  subscriptionId: string;
  attrs: SubscriptionAttrs;
} | null {
  if (!body || typeof body !== "object") return null;
  const root = body as { data?: { type?: string; id?: string; attributes?: SubscriptionAttrs } };
  if (root.data?.type !== "subscriptions" || !root.data.id || !root.data.attributes) {
    return null;
  }
  return { subscriptionId: root.data.id, attrs: root.data.attributes };
}

async function syncSubscriptionToOrg(clerkOrgId: string, subscriptionId: string, attrs: SubscriptionAttrs) {
  const status = attrs.status ?? "";
  const variantId = attrs.variant_id;
  const customerId = attrs.customer_id;
  const mapped = planFromVariantId(variantId ?? null);

  if (status === "expired") {
    await prisma.organization.updateMany({
      where: { clerkOrgId },
      data: {
        plan: "FREE" as Plan,
        lemonSqueezySubscriptionId: null,
        lemonSqueezyCustomerId: null,
      },
    });
    return;
  }

  const keepPaidPlanStatuses = new Set([
    "active",
    "on_trial",
    "paused",
    "past_due",
    "cancelled",
    "unpaid",
  ]);
  if (!keepPaidPlanStatuses.has(status)) {
    return;
  }

  if (!mapped) {
    return;
  }

  const customerStr =
    customerId !== undefined && customerId !== null ? String(customerId) : undefined;

  await prisma.organization.updateMany({
    where: { clerkOrgId },
    data: {
      plan: mapped,
      lemonSqueezySubscriptionId: subscriptionId,
      ...(customerStr ? { lemonSqueezyCustomerId: customerStr } : {}),
    },
  });
}

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ success: false, error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get("x-signature") ?? req.headers.get("X-Signature");
  if (!sigHeader) {
    return Response.json({ success: false, error: "Missing signature" }, { status: 400 });
  }

  let signature: Buffer;
  try {
    signature = Buffer.from(sigHeader, "hex");
  } catch {
    return Response.json({ success: false, error: "Invalid signature encoding" }, { status: 400 });
  }

  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest();
  if (signature.length !== hmac.length || !crypto.timingSafeEqual(signature, hmac)) {
    return Response.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const meta = (body as { meta?: unknown }).meta;
  const eventName =
    (meta && typeof meta === "object" && "event_name" in meta && typeof (meta as LemonMeta).event_name === "string"
      ? (meta as LemonMeta).event_name
      : null) ?? req.headers.get("x-event-name");

  const clerkOrgId = clerkOrgIdFromMeta(meta);

  const subscriptionEvents = new Set([
    "subscription_created",
    "subscription_updated",
    "subscription_cancelled",
    "subscription_resumed",
    "subscription_expired",
    "subscription_paused",
    "subscription_unpaused",
    "subscription_payment_success",
    "subscription_payment_failed",
    "subscription_payment_recovered",
  ]);

  if (eventName && subscriptionEvents.has(eventName) && clerkOrgId) {
    const parsed = parseSubscriptionPayload(body);
    if (parsed) {
      try {
        await syncSubscriptionToOrg(clerkOrgId, parsed.subscriptionId, parsed.attrs);
      } catch {
        return Response.json({ success: false, error: "Database error" }, { status: 500 });
      }
    }
  }

  return Response.json({ success: true, received: true });
}
