import { describe, expect, it } from "vitest";

import { ORIGIN_NOT_ALLOWED_ERROR } from "@/lib/agent-security/constants";
import { denyIfOriginNotAllowed } from "@/lib/agent-security/widget-access";

describe("denyIfOriginNotAllowed", () => {
  it("allows any origin when the allowlist is empty", () => {
    const headers = new Headers({ origin: "https://other.com" });
    expect(denyIfOriginNotAllowed(headers, [])).toBeNull();
  });

  it("rejects a missing or unknown origin when allowlisted", () => {
    const allowed = ["shop.example.com"];
    expect(denyIfOriginNotAllowed(new Headers(), allowed)).toEqual({
      status: 403,
      error: ORIGIN_NOT_ALLOWED_ERROR,
    });
    expect(
      denyIfOriginNotAllowed(
        new Headers({ origin: "https://evil.com" }),
        allowed,
      ),
    ).toEqual({
      status: 403,
      error: ORIGIN_NOT_ALLOWED_ERROR,
    });
    expect(
      denyIfOriginNotAllowed(
        new Headers({ origin: "https://shop.example.com" }),
        allowed,
      ),
    ).toBeNull();
  });
});
