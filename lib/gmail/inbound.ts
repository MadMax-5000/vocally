import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import {
  getEmailChannelConfig,
  isEmailChannelEnabled,
} from "@/lib/deploy/email-channel-config";
import {
  createEmailSession,
  findActiveEmailSession,
  resolveActiveEmailAgent,
  storeEmailMessage,
} from "@/lib/email/session-helpers";
import { logServerError, logServerWarning } from "@/lib/logger";

import type { gmail_v1 } from "googleapis";

import { getGmailClientByEmail } from "./client";
import { parseGmailMessage } from "./parse-message";
import { appendSignature, buildReplySubject, sendGmailMessage } from "./send";

type PubSubNotification = {
  emailAddress: string;
  historyId: string;
};

export function decodePubSubData(data: string): PubSubNotification | null {
  try {
    const json = JSON.parse(Buffer.from(data, "base64").toString("utf8")) as PubSubNotification;
    if (!json.emailAddress || !json.historyId) return null;
    return json;
  } catch {
    return null;
  }
}

export async function handleGmailPubSubNotification(
  notification: PubSubNotification,
): Promise<void> {
  const client = await getGmailClientByEmail(notification.emailAddress);
  if (!client) {
    logServerWarning("gmail_push_unknown_mailbox", { email: notification.emailAddress });
    return;
  }

  const { gmail, connection, agent } = client;
  const emailChannel = agent.channels[0];
  if (!emailChannel?.enabled || !isEmailChannelEnabled(agent.channels)) {
    return;
  }

  const emailConfig = getEmailChannelConfig(agent.channels);
  if (emailConfig.autoReplyEnabled === false) {
    return;
  }

  const startHistoryId = connection.historyId;
  if (!startHistoryId) {
    logServerWarning("gmail_push_no_history", { agentId: agent.id });
    return;
  }

  let pageToken: string | undefined;
  const messageIds = new Set<string>();

  do {
    const historyRes = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      historyTypes: ["messageAdded"],
      pageToken,
    });

    for (const record of historyRes.data.history ?? []) {
      for (const added of record.messagesAdded ?? []) {
        const id = added.message?.id;
        if (id) messageIds.add(id);
      }
    }

    pageToken = historyRes.data.nextPageToken ?? undefined;
  } while (pageToken);

  await prisma.gmailConnection.update({
    where: { id: connection.id },
    data: { historyId: notification.historyId },
  });

  const googleEmail = connection.googleEmail.toLowerCase();

  for (const messageId of messageIds) {
    const existing = await prisma.gmailMessageDedupe.findUnique({
      where: { gmailMessageId: messageId },
    });
    if (existing) continue;

    try {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      const parsed = parseGmailMessage(full.data);
      if (!parsed) continue;

      if (parsed.from === googleEmail) continue;

      const labelIds = full.data.labelIds ?? [];
      const watchLabels = client.labelIds;
      if (!watchLabels.some((l) => labelIds.includes(l))) continue;

      await prisma.gmailMessageDedupe.create({
        data: { gmailMessageId: messageId },
      });

      await processInboundGmailMessage({
        orgId: connection.orgId,
        agentId: agent.id,
        googleEmail,
        parsed,
        emailConfig,
        gmail,
      });
    } catch (err) {
      logServerError("gmail_message_process_failed", {
        agentId: agent.id,
        messageId,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }
}

async function processInboundGmailMessage(params: {
  orgId: string;
  agentId: string;
  googleEmail: string;
  parsed: ReturnType<typeof parseGmailMessage> & object;
  emailConfig: ReturnType<typeof getEmailChannelConfig>;
  gmail: gmail_v1.Gmail;
}): Promise<void> {
  const { orgId, agentId, googleEmail, parsed, emailConfig, gmail } = params;
  if (!parsed) return;

  const customerEmail = parsed.from;
  const body = parsed.body;

  const sessionId =
    (await findActiveEmailSession(orgId, customerEmail)) ??
    (await createEmailSession(orgId, agentId, customerEmail));

  await storeEmailMessage(sessionId, "USER", body);

  const activeAgentId = agentId ?? (await resolveActiveEmailAgent(orgId));
  if (!activeAgentId) {
    const fallback =
      "No active email agent is configured for your organization. Please contact support.";
    await storeEmailMessage(sessionId, "BOT", fallback);
    await sendGmailMessage(gmail, {
      from: googleEmail,
      to: customerEmail,
      subject: buildReplySubject(parsed.subject, emailConfig.replySubjectPrefix),
      body: fallback,
      threadId: parsed.threadId,
      inReplyTo: parsed.messageIdHeader,
      references: parsed.references ?? parsed.messageIdHeader,
    });
    return;
  }

  const { botContent } = await processMessage({
    orgId,
    agentId: activeAgentId,
    sessionId,
    message: body,
    channel: "EMAIL",
  });

  const replyBody = appendSignature(botContent, emailConfig.signature);
  await storeEmailMessage(sessionId, "BOT", replyBody);

  await sendGmailMessage(gmail, {
    from: googleEmail,
    to: customerEmail,
    subject: buildReplySubject(parsed.subject, emailConfig.replySubjectPrefix),
    body: replyBody,
    threadId: parsed.threadId,
    inReplyTo: parsed.messageIdHeader,
    references: parsed.references ?? parsed.messageIdHeader,
  });
}
