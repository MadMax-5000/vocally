import { PERSONA_VARIABLE_KEYS } from "./constants";

export type AgentVariableLike = {
  key: string;
  value: string;
};

export function resolveTestingAsLabel(
  variables: AgentVariableLike[],
  fallback: string,
): string {
  for (const key of PERSONA_VARIABLE_KEYS) {
    const match = variables.find(
      (row) => row.key.toLowerCase() === key && row.value.trim(),
    );
    if (match) return match.value.trim();
  }
  const first = variables.find((row) => row.value.trim());
  return first?.value.trim() || fallback;
}

export function buildTestChatContext(
  variables: AgentVariableLike[],
  testingAs: string,
): string | undefined {
  const pairs = variables
    .filter((row) => row.key.trim() && row.value.trim())
    .map((row) => `${row.key.trim()}=${row.value.trim()}`);
  if (pairs.length === 0) {
    return testingAs ? `Testing as ${testingAs}.` : undefined;
  }
  return `Testing as ${testingAs}. Variables: ${pairs.join(", ")}`;
}
