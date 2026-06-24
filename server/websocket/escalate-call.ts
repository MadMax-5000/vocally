import { buildDialTwiML } from "../../lib/twilio/voice/twiml";
import { logServerError } from "../../lib/logger";

const TWILIO_API = "https://api.twilio.com/2010-04-01";

export async function getHandoffPhoneNumber(agentId: string | null): Promise<string> {
  const envVar = process.env.HANDOFF_PHONE_NUMBER;
  if (envVar) return envVar;

  if (agentId) {
    try {
      const { prisma } = await import("../../lib/db/prisma");
      const channel = await prisma.agentChannel.findFirst({
        where: { agentId, channel: "VOICE_CALLS", enabled: true },
        select: { config: true },
      });
      if (channel?.config && typeof channel.config === "object") {
        const cfg = channel.config as Record<string, unknown>;
        if (cfg.handoffPhone && typeof cfg.handoffPhone === "string") {
          return cfg.handoffPhone;
        }
      }
    } catch { /* ignore */ }
  }

  throw new Error(
    "No handoff phone number configured. Set HANDOFF_PHONE_NUMBER env var or configure handoffPhone in the agent's VOICE_CALLS channel config.",
  );
}

export async function escalateCall(params: {
  callSid: string;
  handoffPhone: string;
  message?: string;
}): Promise<boolean> {
  const { callSid, handoffPhone, message } = params;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
        logServerError("escalate.missing_twilio_credentials", {});
    return false;
  }

  const twiml = buildDialTwiML(handoffPhone, message);
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const res = await fetch(
      `${TWILIO_API}/Accounts/${accountSid}/Calls/${callSid}.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ Twiml: twiml }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
            logServerError("escalate.twilio_api_error", { status: res.status, body });
      return false;
    }

    return true;
  } catch (err) {
        logServerError("escalate.network_error", { error: String(err) });
    return false;
  }
}
