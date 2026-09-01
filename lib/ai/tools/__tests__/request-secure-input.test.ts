import { beforeEach, describe, expect, it } from "vitest";

import {
  dtmfRequestStore,
  handleRequestSecureInput,
} from "@/lib/ai/tools/handlers";
import type { ToolContext } from "@/lib/ai/tools/types";

const voiceCtx: ToolContext = {
  orgId: "org_1",
  sessionId: "session_voice",
  channel: "VOICE",
};

const whatsappCtx: ToolContext = {
  orgId: "org_1",
  sessionId: "session_wa",
  channel: "WHATSAPP",
};

const args = {
  prompt: "your phone number",
  description: "phone",
};

describe("handleRequestSecureInput", () => {
  beforeEach(() => {
    dtmfRequestStore.clear();
  });

  it("stores a DTMF request on voice", async () => {
    const result = await handleRequestSecureInput(args, voiceCtx);
    expect(JSON.parse(result)).toEqual({
      status: "awaiting_dtmf_input",
      prompt: "your phone number",
    });
    expect(dtmfRequestStore.get("session_voice")?.finishOnKey).toBe("#");
  });

  it("rejects non-voice channels and does not store a DTMF request", async () => {
    const result = await handleRequestSecureInput(args, whatsappCtx);
    const parsed = JSON.parse(result) as { error: string };
    expect(parsed.error).toContain("only available on phone calls");
    expect(parsed.error).toContain("press #");
    expect(dtmfRequestStore.has("session_wa")).toBe(false);
  });
});
