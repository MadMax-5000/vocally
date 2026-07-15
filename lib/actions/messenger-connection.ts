"use server";

export type AgentMessengerSettings = {
  connection: {
    pageId: string;
    pageName: string | null;
    connectedAt: Date;
    webhookVerifyToken: string;
  } | null;
};

export async function getAgentMessengerSettings(
  _agentId: string,
): Promise<{ success: boolean; data: AgentMessengerSettings }> {
  return { success: true, data: { connection: null } };
}
