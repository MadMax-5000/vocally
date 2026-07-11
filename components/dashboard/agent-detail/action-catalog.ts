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

export const ACTION_CATALOG_TYPE_LABEL_KEYS: Record<
  ActionCatalogType,
  string
> = {
  all: "catalog.filters.all",
  escalation: "catalog.filters.escalation",
  custom: "catalog.filters.custom",
  commerce: "catalog.filters.commerce",
  live_chat: "catalog.filters.liveChat",
  messaging: "catalog.filters.messaging",
  scheduling: "catalog.filters.scheduling",
  utility: "catalog.filters.utility",
};

export const ACTION_CATALOG: ActionCatalogEntry[] = [
  {
    id: "escalations",
    title: "catalog.escalations.title",
    description: "catalog.escalations.description",
    pills: ["catalog.escalations.pills.createTicket"],
    type: "escalation",
    icon: "escalation-stack",
  },
  {
    id: "custom-actions",
    title: "catalog.customActions.title",
    description: "catalog.customActions.description",
    pills: [
      "catalog.customActions.pills.callApi",
      "catalog.customActions.pills.runClientCode",
      "catalog.customActions.pills.callApiShowWidget",
      "catalog.customActions.pills.showWidget",
    ],
    type: "custom",
    icon: "api",
  },
  {
    id: "collect-leads",
    title: "catalog.collectLeads.title",
    description: "catalog.collectLeads.description",
    pills: ["catalog.collectLeads.pills.collectLeads"],
    type: "custom",
    icon: "user-group",
  },
  {
    id: "stripe",
    title: "catalog.stripe.title",
    description: "catalog.stripe.description",
    pills: [
      "catalog.stripe.pills.invoices",
      "catalog.stripe.pills.subscriptions",
      "catalog.stripe.pills.customerInfo",
      "catalog.stripe.pills.manageSubscriptions",
    ],
    type: "commerce",
    icon: "stripe",
  },
  {
    id: "shopify",
    title: "catalog.shopify.title",
    description: "catalog.shopify.description",
    pills: [
      "catalog.shopify.pills.products",
      "catalog.shopify.pills.orders",
      "catalog.shopify.pills.customerProfile",
      "catalog.shopify.pills.billingAddress",
      "catalog.shopify.pills.cart",
    ],
    type: "commerce",
    icon: "shopify",
  },
  {
    id: "custom-form",
    title: "catalog.customForm.title",
    description: "catalog.customForm.description",
    pills: ["catalog.customForm.pills.form"],
    type: "custom",
    icon: "file",
  },
  {
    id: "suggested-messages",
    title: "catalog.suggestedMessages.title",
    description: "catalog.suggestedMessages.description",
    pills: ["catalog.suggestedMessages.pills.suggestedMessages"],
    type: "messaging",
    icon: "message",
  },
  {
    id: "sunshine-live-chat",
    title: "catalog.sunshineLiveChat.title",
    description: "catalog.sunshineLiveChat.description",
    pills: ["catalog.sunshineLiveChat.pills.liveChat"],
    type: "live_chat",
    icon: "sun",
  },
  {
    id: "salesforce-live-chat",
    title: "catalog.salesforceLiveChat.title",
    description: "catalog.salesforceLiveChat.description",
    pills: ["catalog.salesforceLiveChat.pills.liveChat"],
    type: "live_chat",
    icon: "salesforce",
  },
  {
    id: "slack",
    title: "catalog.slack.title",
    description: "catalog.slack.description",
    pills: ["catalog.slack.pills.sendMessages"],
    type: "messaging",
    icon: "slack",
  },
  {
    id: "cal",
    title: "catalog.cal.title",
    description: "catalog.cal.description",
    pills: ["catalog.cal.pills.bookSlots"],
    type: "scheduling",
    icon: "cal",
  },
  {
    id: "book-appointment",
    title: "catalog.bookAppointment.title",
    description: "catalog.bookAppointment.description",
    pills: ["catalog.bookAppointment.pills.bookAppointment"],
    type: "scheduling",
    icon: "calendar",
  },
  {
    id: "calendly",
    title: "catalog.calendly.title",
    description: "catalog.calendly.description",
    pills: ["catalog.calendly.pills.bookSlots"],
    type: "scheduling",
    icon: "calendar",
  },
  {
    id: "tavily",
    title: "catalog.tavily.title",
    description: "catalog.tavily.description",
    pills: ["catalog.tavily.pills.webSearch"],
    type: "utility",
    icon: "tavily",
  },
  {
    id: "custom-button",
    title: "catalog.customButton.title",
    description: "catalog.customButton.description",
    pills: ["catalog.customButton.pills.customButton"],
    type: "utility",
    icon: "cursor",
  },
];
