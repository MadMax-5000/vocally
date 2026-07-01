import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSessionFindUnique = vi.fn();
const mockAgentFindFirst = vi.fn();
const mockFormSubmissionCreate = vi.fn();
const mockMessageCreate = vi.fn();
const mockProcessMessage = vi.fn();
const mockSendEmail = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => mockSessionFindUnique(...args),
    },
    agent: {
      findFirst: (...args: unknown[]) => mockAgentFindFirst(...args),
    },
    formSubmission: {
      create: (...args: unknown[]) => mockFormSubmissionCreate(...args),
    },
    message: {
      create: (...args: unknown[]) => mockMessageCreate(...args),
    },
  },
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      constructor(message: string, { code }: { code: string }) {
        super(message);
        this.code = code;
      }
    },
  },
}));

vi.mock("@/lib/ai/process-message", () => ({
  processMessage: (...args: unknown[]) => mockProcessMessage(...args),
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import { handleFormSubmit } from "@/lib/api/form-submit-handler";

describe("handleFormSubmit notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-key";

    mockSessionFindUnique.mockResolvedValue({
      orgId: "org-1",
      agentId: "agent-1",
    });

    mockAgentFindFirst.mockResolvedValue({
      name: "Sales Bot",
      channels: [
        {
          channel: "WEB_CHAT",
          config: {
            actions: {
              customForm: {
                enabled: true,
                formId: "form_abc",
                title: "Contact us",
                notifyEmail: "alerts@company.com",
                fields: [
                  { id: "email", type: "email", label: "Email", required: true },
                ],
              },
            },
          },
        },
      ],
    });

    mockFormSubmissionCreate.mockResolvedValue({ id: "sub-1" });
    mockMessageCreate.mockResolvedValue({
      id: "msg-1",
      content: "ok",
      createdAt: new Date(),
    });
    mockProcessMessage.mockResolvedValue({ botContent: "Thanks!" });
    mockSendEmail.mockResolvedValue({ messageId: "email-1" });
  });

  it("sends notify email on successful form submit", async () => {
    const result = await handleFormSubmit({
      orgId: "org-1",
      agentId: "agent-1",
      sessionId: "sess-1",
      formId: "form_abc",
      values: { email: "lead@example.com" },
    });

    expect(result.ok).toBe(true);
    await vi.waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "alerts@company.com",
          subject: expect.stringContaining("Sales Bot"),
          body: expect.stringContaining("lead@example.com"),
        }),
      );
    });
  });
});
