/**
 * Prompt for naming a web-chat conversation the way ChatGPT names threads.
 * Kept deliberately small and deterministic: the result is stored on
 * `Session.title` and shown in the widget history menu.
 */
export function sessionTitlePrompt(): string {
  return `You name customer-support chat conversations.

Return ONLY a short title for the conversation, 2 to 5 words long.
Use the same language as the customer's message.
Do not use quotes, markdown, emoji, or ending punctuation.
Do not say "conversation", "chat", "support", or "assistant".
Describe the customer's intent, not the assistant's answer.
Examples: "Pricing for my team", "Connect Twilio", "Reset my password", "Arabic voice support".`;
}
