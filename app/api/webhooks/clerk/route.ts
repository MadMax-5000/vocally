import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  const payload = await req.json();

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (webhookSecret) {
    const headersList = await headers();
    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);
    try {
      wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }
  }

  const event = payload as WebhookEvent;
  const eventType = event.type;

  try {
    switch (eventType) {
      case "organization.created": {
        const { id, name } = event.data;
        await prisma.organization.create({
          data: { clerkOrgId: id!, name: name! },
        });
        break;
      }
      case "organization.deleted": {
        const { id } = event.data;
        await prisma.organization.deleteMany({
          where: { clerkOrgId: id },
        });
        break;
      }
      case "organizationMembership.created": {
        const { organization } = event.data;
        if (organization?.id && organization?.name) {
          await prisma.organization.upsert({
            where: { clerkOrgId: organization.id },
            create: { clerkOrgId: organization.id, name: organization.name },
            update: { name: organization.name },
          });
        }
        break;
      }
      case "organization.updated": {
        const { id, name } = event.data;
        if (id && name) {
          await prisma.organization.update({
            where: { clerkOrgId: id },
            data: { name },
          });
        }
        break;
      }
    }

    return new Response("Webhook processed", { status: 200 });
  } catch {
    return new Response("Webhook processing failed", { status: 500 });
  }
}
