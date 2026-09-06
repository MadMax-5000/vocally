import { describe, expect, it } from "vitest";

import {
  ASSEMBLYAI_SIP_URI,
  ASSEMBLYAI_TERMINATION_URI,
  getAssemblyAiSipStrategy,
} from "@/lib/assemblyai/sip";

describe("AssemblyAI SIP strategy", () => {
  it("uses native SIP to sip.assemblyai.com", () => {
    expect(getAssemblyAiSipStrategy()).toBe("native");
    expect(ASSEMBLYAI_SIP_URI).toBe("sip:sip.assemblyai.com");
    expect(ASSEMBLYAI_TERMINATION_URI).toBe("sip.assemblyai.com");
  });
});
