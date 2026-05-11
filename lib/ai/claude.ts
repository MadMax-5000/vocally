type ClaudeTextResult = { text: string };

export async function claudeText(_input: { system: string; user: string }): Promise<ClaudeTextResult> {
  throw new Error("Claude client not initialized yet");
}

