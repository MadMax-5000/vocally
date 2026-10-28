import { LLMS_TXT_HEADERS, buildLlmsFullTxt } from "@/lib/seo/llms-files";

/**
 * /llms-full.txt — the complete factual brief in one fetch, for agents that want
 * everything without following links. Keeping it generated means it cannot drift from
 * the pricing constants or the FAQ copy on the site.
 */
export const revalidate = 3600;

export function GET() {
  return new Response(buildLlmsFullTxt(), { headers: LLMS_TXT_HEADERS });
}
