export type ActionCatalogType =
  | "all"
  | "escalation"
  | "custom"
  | "commerce"
  | "live_chat"
  | "messaging"
  | "scheduling"
  | "utility";

export type ActionIconKey =
  | "escalation-stack"
  | "stripe"
  | "shopify"
  | "slack"
  | "cal"
  | "tavily"
  | "salesforce"
  | "api"
  | "user-group"
  | "file"
  | "message"
  | "sun"
  | "calendar"
  | "cursor";

export type ActionCatalogEntry = {
  id: string;
  title: string;
  description: string;
  pills: string[];
  type: Exclude<ActionCatalogType, "all">;
  icon: ActionIconKey;
};

export const IMPLEMENTED_ACTION_IDS = [
  "suggested-messages",
  "custom-button",
  "custom-form",
  "collect-leads",
  "escalations",
  "book-appointment",
] as const;

export type ImplementedActionId = (typeof IMPLEMENTED_ACTION_IDS)[number];

export function isActionImplemented(id: string): id is ImplementedActionId {
  return (IMPLEMENTED_ACTION_IDS as readonly string[]).includes(id);
}

export const ACTION_CATALOG_TYPE_LABELS: Record<
  Exclude<ActionCatalogType, "all">,
  string
> = {
  escalation: "Escalation",
  custom: "Custom",
  commerce: "Commerce",
  live_chat: "Live chat",
  messaging: "Messaging",
  scheduling: "Scheduling",
  utility: "Utility",
};

export const ACTION_CATALOG: ActionCatalogEntry[] = [
  {
    id: "escalations",
    title: "Escalations",
    description:
      "Create a support ticket on your chosen ticketing system when a customer needs human help",
    pills: ["Create ticket"],
    type: "escalation",
    icon: "escalation-stack",
  },
  {
    id: "custom-actions",
    title: "Custom actions",
    description:
      "Create a custom action that calls your API, runs client-side code, and optionally displays an interactive widget",
    pills: [
      "Call API",
      "Run client-side code",
      "Call API + show widget",
      "Show widget",
    ],
    type: "custom",
    icon: "api",
  },
  {
    id: "collect-leads",
    title: "Collect leads",
    description: "Collect leads by capturing user details",
    pills: ["Collect leads"],
    type: "custom",
    icon: "user-group",
  },
  {
    id: "stripe",
    title: "Stripe",
    description:
      "Handle billing, invoices, and subscription queries directly in chat",
    pills: [
      "Retrieve and display invoices",
      "Retrieve and display subscriptions",
      "Change customer information",
      "Manage subscriptions",
    ],
    type: "commerce",
    icon: "stripe",
  },
  {
    id: "shopify",
    title: "Shopify",
    description:
      "Recommend products, answer order questions, and provide delivery updates",
    pills: [
      "Retrieve and display products",
      "Retrieve and display orders",
      "Update shopify customer profile",
      "Update shopify customer billing address",
      "Get cart",
    ],
    type: "commerce",
    icon: "shopify",
  },
  {
    id: "custom-form",
    title: "Custom form",
    description: "Create a custom form to collect information from your users",
    pills: ["Form"],
    type: "custom",
    icon: "file",
  },
  {
    id: "suggested-messages",
    title: "Suggested messages",
    description: "Customize suggested messages based on the conversation",
    pills: ["Suggested messages"],
    type: "messaging",
    icon: "message",
  },
  {
    id: "sunshine-live-chat",
    title: "Sunshine live chat",
    description:
      "Hand over from the AI agent to live chat with a human support agent",
    pills: ["Live chat"],
    type: "live_chat",
    icon: "sun",
  },
  {
    id: "salesforce-live-chat",
    title: "Salesforce live chat",
    description:
      "Hand over from the AI agent to live chat with a human support agent",
    pills: ["Live chat"],
    type: "live_chat",
    icon: "salesforce",
  },
  {
    id: "slack",
    title: "Slack",
    description:
      "Send notifications and updates to your Slack channels automatically",
    pills: ["Send messages"],
    type: "messaging",
    icon: "slack",
  },
  {
    id: "cal",
    title: "Cal",
    description:
      "Let customers check availability and book meetings without leaving the conversation",
    pills: ["Retrieve and book slots"],
    type: "scheduling",
    icon: "cal",
  },
  {
    id: "book-appointment",
    title: "Book appointment",
    description:
      "Let customers schedule appointments stored in Anselio — no external calendar required",
    pills: ["Book appointment"],
    type: "scheduling",
    icon: "calendar",
  },
  {
    id: "calendly",
    title: "Calendly",
    description:
      "Let customers check availability and book meetings without leaving the conversation",
    pills: ["Retrieve and book slots"],
    type: "scheduling",
    icon: "calendar",
  },
  {
    id: "tavily",
    title: "Tavily",
    description:
      "Give your agent real-time web search to answer questions with live data",
    pills: ["Web search"],
    type: "utility",
    icon: "tavily",
  },
  {
    id: "custom-button",
    title: "Custom button",
    description: "Add custom buttons to trigger your own links and redirects",
    pills: ["Custom button"],
    type: "utility",
    icon: "cursor",
  },
];
