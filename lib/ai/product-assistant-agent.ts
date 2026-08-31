export const PRODUCT_ASSISTANT_AGENT_ID =
  process.env.NEXT_PUBLIC_PRODUCT_ASSISTANT_AGENT_ID ?? "";

export const PRODUCT_ASSISTANT_DEFAULT_RATE_LIMIT = 20;

export function isProductAssistantAgent(agentId: string): boolean {
  return PRODUCT_ASSISTANT_AGENT_ID.length > 0 && agentId === PRODUCT_ASSISTANT_AGENT_ID;
}
