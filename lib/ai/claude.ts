import * as Sentry from "@sentry/nextjs";

type ClaudeTextResult = { text: string };

export async function claudeText(_input: { system: string; user: string }): Promise<ClaudeTextResult> {
  try {
    throw new Error("Claude client not initialized yet");
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

