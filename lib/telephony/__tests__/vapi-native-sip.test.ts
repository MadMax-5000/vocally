import { describe, expect, it } from "vitest";

import {
  isVapiNativeSipUri,
  parseVapiNativeSipAgentId,
  vapiDialedIdentities,
  vapiNativeSipUri,
  vapiNativeSipUsername,
} from "@/lib/telephony/vapi-sip";

describe("vapi native SIP URI", () => {
  it("builds sip:anselio-{agentId}@sip.vapi.ai", () => {
    expect(vapiNativeSipUsername("clxyz123")).toBe("anselio-clxyz123");
    expect(vapiNativeSipUri("clxyz123")).toBe("sip:anselio-clxyz123@sip.vapi.ai");
    expect(isVapiNativeSipUri("sip:anselio-clxyz123@sip.vapi.ai")).toBe(true);
    expect(isVapiNativeSipUri("+212612345678")).toBe(false);
  });

  it("parses the agent id from a URI or username", () => {
    expect(parseVapiNativeSipAgentId("sip:anselio-clxyz123@sip.vapi.ai")).toBe("clxyz123");
    expect(parseVapiNativeSipAgentId("anselio-clxyz123")).toBe("clxyz123");
    expect(parseVapiNativeSipAgentId("+212612345678")).toBeNull();
  });

  it("collects unique dialed identities from a Vapi call payload", () => {
    expect(
      vapiDialedIdentities({
        phoneNumber: {
          number: "sip:anselio-clxyz123@sip.vapi.ai",
          sipUri: "sip:anselio-clxyz123@sip.vapi.ai",
        },
      }),
    ).toEqual(["sip:anselio-clxyz123@sip.vapi.ai"]);
  });
});
