export const MAX_AGENT_TEST_QUESTIONS = 20;
export const MAX_AGENT_TEST_PROMPT_LENGTH = 500;
export const MAX_DEMO_TEST_QUESTIONS = 6;
export const DEMO_TEST_RATE_LIMIT = 5;
export const DEMO_TEST_RATE_WINDOW_MS = 10 * 60 * 1000;

export const PERSONA_VARIABLE_KEYS = [
  "name",
  "full_name",
  "customer_name",
  "first_name",
  "persona",
] as const;

export const JUDGE_MODEL = "openai/gpt-4.1-mini";
