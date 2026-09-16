import { describe, expect, it } from "vitest";

import { sipGatewayHost, vapiSipGateway } from "@/lib/telephony/vapi-sip";

describe("vapiSipGateway", () => {
  it("strips sip: and port from the host", () => {
    expect(sipGatewayHost("sip:sip.voipsense.ma:5060")).toBe("sip.voipsense.ma");
  });

  it("registers outbound for hostname cartes SIP", () => {
    expect(vapiSipGateway("sip.voipsense.ma")).toEqual({
      ip: "sip.voipsense.ma",
      inboundEnabled: false,
    });
  });

  it("enables inbound only for IPv4 hops", () => {
    expect(vapiSipGateway("41.77.12.10")).toEqual({
      ip: "41.77.12.10",
      inboundEnabled: true,
    });
  });
});
