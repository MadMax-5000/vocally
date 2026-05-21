import type { AgentChannelType } from "@prisma/client";

export type DeployCatalogEntry = {
  id: string;
  title: string;
  description: string;
  iconSrc: string;
  beta?: boolean;
  previewPath?: "widget" | "help";
  /** When set, enable/disable maps to `AgentChannel` for this type. */
  channelType?: AgentChannelType;
};

export const FEATURED_DEPLOYMENTS = [
  {
    id: "chat-widget",
    title: "Chat widget",
    description: "Add a floating chat window to your site.",
    heroBackground: "/images/abstract2.png",
    previewPath: "widget" as const,
  },
  {
    id: "help-page",
    title: "Help page",
    description:
      "ChatGPT-style help page, deployed standalone or under a path on your site (/help).",
    heroBackground: "/images/abstract6.jpeg",
    previewPath: "help" as const,
  },
] as const;

export const INTEGRATION_DEPLOYMENTS: DeployCatalogEntry[] = [
  {
    id: "email",
    title: "Email",
    description:
      "Connect your agent to an email address and let it respond to messages from your customers.",
    iconSrc: "/svg/gmail.svg",
    channelType: "EMAIL",
  },
  {
    id: "shopify",
    title: "Shopify",
    description:
      "Connect your agent to Shopify and let it respond to messages from your customers.",
    iconSrc: "/svg/shopify.svg",
  },
  {
    id: "phone",
    title: "Phone",
    description: "Let your AI agent handle inbound phone calls.",
    iconSrc: "/svg/call.svg",
    beta: true,
    channelType: "VOICE_CALLS",
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    description:
      "Connect your agent to a WhatsApp number and let it respond to messages from your customers.",
    iconSrc: "/svg/whatsapp-icon.svg",
    channelType: "WHATSAPP",
  },
  {
    id: "messenger",
    title: "Messenger",
    description:
      "Connect your agent to a Facebook page and let it respond to messages from your customers.",
    iconSrc: "/svg/messenger.svg",
    channelType: "MESSENGER",
  },
  {
    id: "instagram",
    title: "Instagram",
    description:
      "Connect your agent to an Instagram page and let it respond to messages from your customers.",
    iconSrc: "/svg/instagram-icon.svg",
    channelType: "INSTAGRAM",
  },
  {
    id: "zendesk",
    title: "Zendesk",
    description:
      "Let your AI agent draft suggestions or auto-reply to Zendesk tickets.",
    iconSrc: "/svg/zendesk.svg",
  },
  {
    id: "salesforce",
    title: "Salesforce",
    description:
      "Let your AI agent draft suggestions or auto-reply to Salesforce cases.",
    iconSrc: "/svg/salesforce.svg",
  },
  {
    id: "slack",
    title: "Slack",
    description:
      "Connect your agent to Slack, mention it, and have it reply to any message.",
    iconSrc: "/svg/slack.svg",
    channelType: "SLACK",
  },
  {
    id: "wordpress",
    title: "WordPress",
    description:
      "Use the official Vocally plugin for WordPress to embed your agent on your site.",
    iconSrc: "/svg/wordpress.svg",
  },
  {
    id: "api",
    title: "API",
    description:
      "Integrate your agent directly with your applications using our REST API.",
    iconSrc: "/svg/api.svg",
  },
  {
    id: "zapier",
    title: "Zapier",
    description: "Connect your agent with thousands of apps using Zapier.",
    iconSrc: "/svg/zapier.svg",
  },
];

export function getDeployCatalogEntry(
  deploymentId: string,
): DeployCatalogEntry | (typeof FEATURED_DEPLOYMENTS)[number] | undefined {
  const featured = FEATURED_DEPLOYMENTS.find((d) => d.id === deploymentId);
  if (featured) return featured;
  return INTEGRATION_DEPLOYMENTS.find((d) => d.id === deploymentId);
}
