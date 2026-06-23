import { buildAgentChatApiUrl } from "@/lib/deploy/api-config";

const PLACEHOLDER_TOKEN = "YOUR_API_TOKEN";

export type ApiSampleLanguage = "curl" | "javascript" | "python";

export function buildApiCurlSample(
  origin: string,
  agentId: string,
  apiToken: string,
): string {
  const url = buildAgentChatApiUrl(origin, agentId);
  return `curl -X POST "${url}" \\
  -H "Authorization: Bearer ${apiToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello, I need help with my order"}'`;
}

export function buildApiFetchSample(
  origin: string,
  agentId: string,
  apiToken: string,
): string {
  const url = buildAgentChatApiUrl(origin, agentId);
  return `const response = await fetch("${url}", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${apiToken}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: "Hello, I need help with my order",
  }),
});

const data = await response.json();
console.log(data);`;
}

export function buildApiPythonSample(
  origin: string,
  agentId: string,
  apiToken: string,
): string {
  const url = buildAgentChatApiUrl(origin, agentId);
  return `import requests

response = requests.post(
    "${url}",
    headers={
        "Authorization": "Bearer ${apiToken}",
        "Content-Type": "application/json",
    },
    json={"message": "Hello, I need help with my order"},
)

print(response.json())`;
}

export function buildApiSample(
  language: ApiSampleLanguage,
  origin: string,
  agentId: string,
  apiToken: string,
  maskToken = false,
): string {
  const token = maskToken ? PLACEHOLDER_TOKEN : apiToken;
  switch (language) {
    case "curl":
      return buildApiCurlSample(origin, agentId, token);
    case "javascript":
      return buildApiFetchSample(origin, agentId, token);
    case "python":
      return buildApiPythonSample(origin, agentId, token);
  }
}
