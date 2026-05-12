import {
  AgentChannelType,
  AgentStatus,
  AgentTone,
  AgentType,
  Channel,
  CreativityLevel,
  MessageRole,
  PrismaClient,
  SessionStatus,
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

// ─── Demo session data generation ──────────────────────────────────────────

const CHANNELS: Channel[] = ["VOICE", "CHAT", "SMS", "WHATSAPP", "EMAIL"];
const STATUSES: SessionStatus[] = ["RESOLVED", "BOT", "ACTIVE", "ABANDONED", "HUMAN"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function seedDay(dayOffset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

const SAMPLE_MESSAGE_TEMPLATES: Record<string, string[]> = {
  USER: [
    "Hi, I need help with my order",
    "Can you check the status of my account?",
    "I have a question about your service",
    "I'd like to make a reservation",
    "My package hasn't arrived yet",
    "Can you help me reset my password?",
    "I want to speak to a manager",
    "Do you have this item in stock?",
    "I need to cancel my subscription",
    "What are your business hours?",
    "Is there a promotion going on?",
    "I received a damaged product",
    "How do I track my shipment?",
    "I need to update my billing info",
    "Can you connect me with support?",
    "I'm having trouble logging in",
    "شكرا، أحتاج مساعدة في طلبي",
    "Bonjour, je besoin d'aide",
    "What time do you close today?",
    "I want to change my appointment",
  ],
  BOT: [
    "I'd be happy to help you with that!",
    "Let me look up your account details.",
    "I understand your concern. Let me check.",
    "Thank you for reaching out to us.",
    "I can certainly assist with that request.",
    "Let me find the information for you.",
    "Of course! Give me just a moment.",
    "I've found what you need. Here are the details:",
    "Thanks for your patience. I've resolved this.",
    "Your request has been processed successfully.",
  ],
  AGENT: [
    "Thank you for holding. I'm looking into this now.",
    "I've reviewed your account and I can help.",
    "Let me transfer you to the right department.",
    "I understand how frustrating this must be.",
    "I've escalated this to our senior team.",
    "I'm going to take over from here. How can I help?",
  ],
};

const BOT_REPLIES = SAMPLE_MESSAGE_TEMPLATES.BOT;
const USER_QUESTIONS = SAMPLE_MESSAGE_TEMPLATES.USER;
const AGENT_REPLIES = SAMPLE_MESSAGE_TEMPLATES.AGENT;

function generateMessageChain(sessionCreatedAt: Date, status: SessionStatus, channel: Channel) {
  const messages: { role: MessageRole; content: string; createdAt: Date }[] = [];
  const numMessages = channel === "VOICE" ? 2 + Math.floor(Math.random() * 6) : 4 + Math.floor(Math.random() * 7);
  let t = new Date(sessionCreatedAt);

  for (let i = 0; i < numMessages; i++) {
    const isLast = i === numMessages - 1;
    if (i === 0) {
      messages.push({ role: "USER", content: pick(USER_QUESTIONS), createdAt: new Date(t) });
    } else if (i === 1) {
      t = new Date(t.getTime() + 2000 + Math.random() * 8000);
      messages.push({ role: "BOT", content: pick(BOT_REPLIES), createdAt: new Date(t) });
    } else if (i % 2 === 0) {
      t = new Date(t.getTime() + 3000 + Math.random() * 15000);
      messages.push({ role: "USER", content: pick(USER_QUESTIONS), createdAt: new Date(t) });
    } else {
      t = new Date(t.getTime() + 2000 + Math.random() * 10000);
      if (status === "HUMAN" && i > numMessages / 2) {
        messages.push({ role: "AGENT", content: pick(AGENT_REPLIES), createdAt: new Date(t) });
      } else {
        messages.push({ role: "BOT", content: pick(BOT_REPLIES), createdAt: new Date(t) });
      }
    }
  }

  return messages;
}

async function seedDemoSessions(orgId: string): Promise<void> {
  const agents = await prisma.agent.findMany({
    where: { orgId },
    select: { id: true, channels: true },
  });
  if (agents.length === 0) {
    console.log("  ⚠ No agents found — skipping session seeding.");
    return;
  }

  // Determine which agents support voice
  const voiceAgentIds = agents
    .filter((a) => a.channels.some((c) => c.channel === AgentChannelType.VOICE_CALLS))
    .map((a) => a.id);
  const allAgentIds = agents.map((a) => a.id);

  const totalSessions = 75;
  const voicePct = 0.25;
  const resolvedPct = 0.65;
  const botPct = 0.12;
  const humanPct = 0.08;

  let created = 0;

  for (let i = 0; i < totalSessions; i++) {
    const channel: Channel = Math.random() < voicePct ? "VOICE" : pick(CHANNELS.filter((c) => c !== "VOICE"));
    const rand = Math.random();
    let status: SessionStatus;
    if (rand < resolvedPct) status = "RESOLVED";
    else if (rand < resolvedPct + botPct) status = "BOT";
    else if (rand < resolvedPct + botPct + humanPct) status = "HUMAN";
    else if (channel === "VOICE") status = pick(["ACTIVE", "ABANDONED"]);
    else status = pick(["ACTIVE", "ABANDONED", "WAITING"]);

    const dayOffset = Math.floor(Math.random() * 30);
    const createdAt = seedDay(dayOffset);
    const endedAt = status !== "ACTIVE" && status !== "WAITING"
      ? new Date(createdAt.getTime() + 30_000 + Math.random() * 300_000)
      : null; // eslint-disable-line @typescript-eslint/no-unused-vars
    const sentiment = parseFloat(randBetween(-0.6, 1.0).toFixed(2));
    const resolvedByAI = status === "RESOLVED" ? Math.random() < 0.75 : status === "BOT";

    const msgChain = generateMessageChain(createdAt, status, channel);

    let agentId: string | null = null;
    if (channel === "VOICE" && voiceAgentIds.length > 0) {
      agentId = pick(voiceAgentIds);
    } else if (allAgentIds.length > 0 && Math.random() < 0.2) {
      agentId = pick(allAgentIds);
    }

    const session = await prisma.session.create({
      data: {
        orgId,
        channel,
        language: pick(["ar", "fr", "en", "auto"]),
        status,
        agentId,
        sentiment,
        resolvedByAI,
        startedAt: createdAt,
        endedAt,
        createdAt,
        messages: {
          createMany: {
            data: msgChain.map((m) => ({
              role: m.role,
              content: m.content,
              createdAt: m.createdAt,
            })),
          },
        },
      },
    });

    // Voice sessions get a CallLog
    if (channel === "VOICE") {
      const durationSec = Math.floor(randBetween(30, 600));
      const qaScore = parseFloat(randBetween(50, 100).toFixed(1));
      const cost = parseFloat(randBetween(0.02, 0.50).toFixed(4));
      const llmCost = parseFloat(randBetween(0.01, 0.30).toFixed(4));

      await prisma.callLog.create({
        data: {
          orgId,
          sessionId: session.id,
          duration: durationSec,
          qaScore,
          cost,
          llmCost,
          recordingUrl: `https://storage.example.com/recordings/${session.id}.mp3`,
          createdAt,
        },
      });
    }

    created++;
    if (created % 25 === 0) {
      console.log(`  … ${created}/${totalSessions} sessions seeded`);
    }
  }

  console.log(`  ✓ ${created} sessions with messages and call logs`);
}

async function main(): Promise<void> {
  const orgId = await resolveTargetOrgId();
  console.log(`Seeding demo agents for org ${orgId}…`);

  for (const demo of DEMO_AGENTS) {
    await seedDemoAgent(orgId, demo);
    console.log(`  ✓ ${demo.name}`);
  }

  console.log(`Done. Upserted ${DEMO_AGENTS.length} demo agents.`);

  console.log(`Seeding demo sessions for org ${orgId}…`);
  await seedDemoSessions(orgId);
  console.log(`Done seeding sessions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
