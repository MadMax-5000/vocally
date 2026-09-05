/**
 * Seed script: Creates the internal "Anselio Assistant" product-help agent.
 *
 * Run with:  npx tsx prisma/seed-product-assistant.ts
 *
 * The agent is created in the first org that has existing agents (or the first
 * org if none). It comes with a WEB_CHAT channel pre-configured and sensible
 * defaults for the in-app product assistant.
 *
 * After running, copy the printed agent ID into your .env.local as
 * NEXT_PUBLIC_PRODUCT_ASSISTANT_AGENT_ID.
 */

import {
  AgentChannelType,
  AgentStatus,
  AgentTone,
  AgentType,
  CreativityLevel,
  PrismaClient,
  SupportedLanguage,
} from "@prisma/client";

const prisma = new PrismaClient();

const ASSISTANT_AGENT_NAME = "Anselio Assistant";
const LEGACY_ASSISTANT_NAMES = ["Vocally Assistant"];

const ASSISTANT_DESCRIPTION =
  "Product assistant that helps visitors and users with questions about Anselio — features, setup, billing, and troubleshooting.";

const ASSISTANT_INSTRUCTIONS =
  "You are the Anselio product assistant. Help visitors and users with questions about the Anselio conversational AI platform (chat, email, voice). Be concise, helpful, and accurate. Answer in the same language the visitor is using. Do not invent prices or unreleased features.";

async function resolveTargetOrgId(): Promise<string> {
  const withAgents = await prisma.organization.findFirst({
    where: { agents: { some: {} } },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  if (withAgents) return withAgents.id;

  const anyOrg = await prisma.organization.findFirst({
    orderBy: { id: "asc" },
    select: { id: true },
  });
  if (!anyOrg) {
    throw new Error(
      "No Organization found. Sign in once to create one, then re-run this script.",
    );
  }
  return anyOrg.id;
}

const WIDGET_CONFIG = {
  displayName: "Ask Anselio",
  appearance: "light" as const,
  primaryColor: "#FF5A36",
  bubbleColor: "#FF5A36",
  placeholder: "Ask about Anselio...",
  voiceToTextEnabled: false,
  attachmentsEnabled: false,
  autoShowWelcomePopup: true,
  welcomePopupDelaySec: 5,
  autoShowWelcomePopupMobile: false,
};

const SUGGESTED_MESSAGES = {
  enabled: true,
  staticStarters: [
    "What is Anselio?",
    "What plans do you offer?",
    "How do I create my first AI agent?",
    "How do I deploy the chat widget?",
    "How does the knowledge base work?",
    "How do I set up WhatsApp?",
  ],
  keepShowingAfterFirst: true,
  dynamicEnabled: false,
};

const CUSTOM_BUTTONS = {
  enabled: true,
  buttons: [
    {
      label: "Contact Support",
      kind: "link" as const,
      href: "mailto:support@anselio.com",
      openInNewTab: true,
    },
    {
      label: "Documentation",
      kind: "link" as const,
      href: "https://anselio.com/docs",
      openInNewTab: true,
    },
  ],
};

const CHANNEL_CONFIG = {
  widget: WIDGET_CONFIG,
  actions: {
    suggestedMessages: SUGGESTED_MESSAGES,
    customButtons: CUSTOM_BUTTONS,
  },
};

const AGENT_FIELDS = {
  agentType: AgentType.TECHNOLOGY_SOFTWARE,
  tone: AgentTone.FRIENDLY,
  creativity: CreativityLevel.BALANCED,
  description: ASSISTANT_DESCRIPTION,
  handoffEnabled: true,
  status: AgentStatus.ACTIVE,
  visibility: "PUBLIC" as const,
  defaultLanguage: SupportedLanguage.ENGLISH,
  llmModel: "z-ai/glm-5.3-flash",
  instructions: ASSISTANT_INSTRUCTIONS,
};

async function main(): Promise<void> {
  const orgId = await resolveTargetOrgId();
  console.log(`Target org: ${orgId}`);

  const existing = await prisma.agent.findFirst({
    where: {
      orgId,
      name: { in: [ASSISTANT_AGENT_NAME, ...LEGACY_ASSISTANT_NAMES] },
    },
    orderBy: { createdAt: "asc" },
  });

  const widgetToken = existing?.widgetToken ?? crypto.randomUUID();

  const agent = existing
    ? await prisma.agent.update({
        where: { id: existing.id },
        data: {
          name: ASSISTANT_AGENT_NAME,
          widgetToken,
          ...AGENT_FIELDS,
        },
      })
    : await prisma.agent.create({
        data: {
          orgId,
          name: ASSISTANT_AGENT_NAME,
          widgetToken,
          ...AGENT_FIELDS,
        },
      });

  console.log(`Agent: ${agent.name} (${agent.id})`);

  await prisma.$transaction(async (tx) => {
    await tx.agentLanguage.deleteMany({ where: { agentId: agent.id } });
    await tx.agentChannel.deleteMany({ where: { agentId: agent.id } });

    await tx.agentLanguage.createMany({
      data: [
        { agentId: agent.id, language: SupportedLanguage.ENGLISH },
        { agentId: agent.id, language: SupportedLanguage.FRENCH },
        { agentId: agent.id, language: SupportedLanguage.ARABIC },
      ],
    });

    await tx.agentChannel.create({
      data: {
        agentId: agent.id,
        channel: AgentChannelType.WEB_CHAT,
        enabled: true,
        config: CHANNEL_CONFIG,
      },
    });
  });

  console.log("✓ WEB_CHAT channel configured with suggested messages & custom buttons");
  console.log(`\n✓ Done! Agent ID: ${agent.id}`);
  console.log(`  Add to .env.local:  NEXT_PUBLIC_PRODUCT_ASSISTANT_AGENT_ID=${agent.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
