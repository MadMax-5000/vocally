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

type DemoAgentSeed = {
  name: string;
  agentType: AgentType;
  tone: AgentTone;
  languages: SupportedLanguage[];
  channels: AgentChannelType[];
  description: string;
  websiteUrl: string;
};

const DEMO_AGENTS: DemoAgentSeed[] = [
  {
    name: "Atlas Retail",
    agentType: AgentType.RETAIL_ECOMMERCE,
    tone: AgentTone.FRIENDLY,
    languages: [SupportedLanguage.DARIJA, SupportedLanguage.FRENCH, SupportedLanguage.ENGLISH],
    channels: [
      AgentChannelType.WEB_CHAT,
      AgentChannelType.WHATSAPP,
      AgentChannelType.INSTAGRAM,
    ],
    description:
      "Help shoppers find products, track orders, and resolve returns in Arabic, Darija, French, or English.",
    websiteUrl: "https://example.com/atlas-retail",
  },
  {
    name: "Nour Care",
    agentType: AgentType.HEALTHCARE_MEDICAL,
    tone: AgentTone.EMPATHETIC,
    languages: [SupportedLanguage.ARABIC, SupportedLanguage.FRENCH],
    channels: [
      AgentChannelType.VOICE_CALLS,
      AgentChannelType.WHATSAPP,
      AgentChannelType.SMS,
    ],
    description:
      "Answer appointment questions, clinic hours, and general triage with clear empathy and compliance boundaries.",
    websiteUrl: "https://example.com/nour-care",
  },
  {
    name: "Casa Estates",
    agentType: AgentType.REAL_ESTATE,
    tone: AgentTone.LUXURY,
    languages: [SupportedLanguage.FRENCH, SupportedLanguage.ENGLISH],
    channels: [
      AgentChannelType.WEB_CHAT,
      AgentChannelType.EMAIL,
      AgentChannelType.VOICE_CALLS,
    ],
    description:
      "Qualify buyers and renters, schedule viewings, and share listing highlights with a refined tone.",
    websiteUrl: "https://example.com/casa-estates",
  },
  {
    name: "Medina Eats",
    agentType: AgentType.FOOD_BEVERAGE,
    tone: AgentTone.ENERGETIC,
    languages: [SupportedLanguage.DARIJA, SupportedLanguage.FRENCH],
    channels: [
      AgentChannelType.WHATSAPP,
      AgentChannelType.MESSENGER,
      AgentChannelType.INSTAGRAM,
    ],
    description:
      "Take reservations, answer menu questions, and handle delivery updates across chat and social.",
    websiteUrl: "https://example.com/medina-eats",
  },
  {
    name: "Argan Bank",
    agentType: AgentType.FINANCE_BANKING,
    tone: AgentTone.PROFESSIONAL,
    languages: [
      SupportedLanguage.ARABIC,
      SupportedLanguage.FRENCH,
      SupportedLanguage.ENGLISH,
    ],
    channels: [
      AgentChannelType.VOICE_CALLS,
      AgentChannelType.WEB_CHAT,
      AgentChannelType.EMAIL,
    ],
    description:
      "Guide customers on branch services, card basics, and secure next steps without collecting sensitive data in chat.",
    websiteUrl: "https://example.com/argan-bank",
  },
];

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
      "No Organization row found. Create an org (e.g. sign in once) or insert one before seeding.",
    );
  }
  return anyOrg.id;
}

async function seedDemoAgent(orgId: string, demo: DemoAgentSeed): Promise<void> {
  const agent = await prisma.agent.upsert({
    where: {
      orgId_name: {
        orgId,
        name: demo.name,
      },
    },
    create: {
      orgId,
      name: demo.name,
      agentType: demo.agentType,
      tone: demo.tone,
      creativity: CreativityLevel.BALANCED,
      description: demo.description,
      websiteUrl: demo.websiteUrl,
      handoffEnabled: true,
      status: AgentStatus.ACTIVE,
    },
    update: {
      agentType: demo.agentType,
      tone: demo.tone,
      creativity: CreativityLevel.BALANCED,
      description: demo.description,
      websiteUrl: demo.websiteUrl,
      handoffEnabled: true,
      status: AgentStatus.ACTIVE,
      customTone: null,
      customRole: null,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.agentLanguage.deleteMany({ where: { agentId: agent.id } });
    await tx.agentChannel.deleteMany({ where: { agentId: agent.id } });

    await tx.agentLanguage.createMany({
      data: demo.languages.map((language) => ({
        agentId: agent.id,
        language,
      })),
    });

    await tx.agentChannel.createMany({
      data: demo.channels.map((channel) => ({
        agentId: agent.id,
        channel,
        enabled: true,
      })),
    });
  });
}

async function main(): Promise<void> {
  const orgId = await resolveTargetOrgId();
  console.log(`Seeding demo agents for org ${orgId}…`);

  for (const demo of DEMO_AGENTS) {
    await seedDemoAgent(orgId, demo);
    console.log(`  ✓ ${demo.name}`);
  }

  console.log(`Done. Upserted ${DEMO_AGENTS.length} demo agents.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
