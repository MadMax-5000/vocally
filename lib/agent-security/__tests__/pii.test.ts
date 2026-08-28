import { describe, expect, it } from "vitest";

import { redactPii } from "@/lib/agent-security/pii";

describe("redactPii", () => {
  it("redacts email, phone, card, and Moroccan CIN", () => {
    const input =
      "Reach me at ada@example.com or +212 6 12 34 56 78. Card 4111 1111 1111 1111 CIN AB123456.";
    const redacted = redactPii(input);
    expect(redacted).toContain("[email]");
    expect(redacted).toContain("[phone]");
    expect(redacted).toContain("[card]");
    expect(redacted).toContain("[id]");
    expect(redacted).not.toContain("ada@example.com");
    expect(redacted).not.toContain("4111");
    expect(redacted).not.toContain("AB123456");
  });
});
