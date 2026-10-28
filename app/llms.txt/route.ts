import { LLMS_TXT_HEADERS, buildLlmsTxt } from "@/lib/seo/llms-files";

/**
 * /llms.txt — see lib/seo/llms-files.ts for how much weight to give this file.
 * Regenerated at request time from the same constants as the pricing page.
 */
export const revalidate = 3600;

export function GET() {
  return new Response(buildLlmsTxt(), { headers: LLMS_TXT_HEADERS });
}
