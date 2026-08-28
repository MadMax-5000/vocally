import { describe, expect, it } from "vitest";

import {
  hostnameFromRequest,
  isHostnameAllowed,
  normalizeHostname,
  parseHostnameList,
} from "@/lib/agent-security/hostnames";

describe("normalizeHostname", () => {
  it("strips protocol and path", () => {
    expect(normalizeHostname("https://www.example.com/chat")).toBe(
      "www.example.com",
    );
  });

  it("keeps localhost ports", () => {
    expect(normalizeHostname("http://localhost:3000")).toBe("localhost:3000");
    expect(normalizeHostname("127.0.0.1:3000")).toBe("127.0.0.1:3000");
  });

  it("rejects empty and invalid values", () => {
    expect(normalizeHostname("")).toBeNull();
    expect(normalizeHostname("https://")).toBeNull();
    expect(normalizeHostname("not a host")).toBeNull();
  });
});

describe("parseHostnameList", () => {
  it("parses mixed separators and de-duplicates", () => {
    expect(
      parseHostnameList("example.com, www.example.com\nexample.com"),
    ).toEqual({
      hostnames: ["example.com", "www.example.com"],
    });
  });

  it("returns invalid when a token is not a hostname", () => {
    expect(parseHostnameList("example.com https://")).toEqual({
      hostnames: [],
      error: "invalid",
    });
  });

  it("caps the allowlist at 10 hostnames", () => {
    const tooMany = Array.from({ length: 11 }, (_, i) => `site${i}.com`).join(
      "\n",
    );
    expect(parseHostnameList(tooMany)).toEqual({
      hostnames: [],
      error: "tooMany",
    });
  });
});

describe("isHostnameAllowed", () => {
  it("allows any origin when the list is empty", () => {
    expect(isHostnameAllowed(null, [])).toBe(true);
    expect(isHostnameAllowed("evil.com", [])).toBe(true);
  });

  it("requires an exact hostname match when set", () => {
    expect(isHostnameAllowed("example.com", ["example.com"])).toBe(true);
    expect(isHostnameAllowed("app.example.com", ["example.com"])).toBe(false);
    expect(isHostnameAllowed(null, ["example.com"])).toBe(false);
  });
});

describe("hostnameFromRequest", () => {
  it("prefers Origin over Referer", () => {
    expect(
      hostnameFromRequest(
        "https://shop.example.com",
        "https://other.com/page",
      ),
    ).toBe("shop.example.com");
  });
});
