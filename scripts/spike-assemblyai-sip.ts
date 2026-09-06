/**
 * Spike: PBXme → sip.assemblyai.com
 *
 * Decision: native SIP (not LiveKit).
 * AssemblyAI inbound audio is sip:sip.assemblyai.com. PBXme already SIP-forwards
 * Moroccan DIDs. We import the E.164 on AssemblyAI and retarget the forward.
 *
 * LiveKit bridge is only if this script's import step returns a hard rejection
 * for non-Twilio termination_uri AND a live call has no audio.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/spike-assemblyai-sip.ts [+212...]
 */

import { bindPhoneNumberAgent, importPhoneNumber } from "@/lib/assemblyai/client";
import { isAssemblyAiConfigured } from "@/lib/assemblyai/env";
import {
  ASSEMBLYAI_SIP_URI,
  ASSEMBLYAI_TERMINATION_URI,
  getAssemblyAiSipStrategy,
} from "@/lib/assemblyai/sip";

async function main() {
  const strategy = getAssemblyAiSipStrategy();
  // eslint-disable-next-line no-console -- spike script
  console.log(JSON.stringify({
    strategy,
    sipUri: ASSEMBLYAI_SIP_URI,
    terminationUri: ASSEMBLYAI_TERMINATION_URI,
    fallback: "livekit-bridge (not built)",
  }));

  if (!isAssemblyAiConfigured()) {
    // eslint-disable-next-line no-console -- spike script
    console.log("ASSEMBLYAI_API_KEY unset — skipping live import.");
    return;
  }

  const number = process.argv[2];
  if (!number) {
    // eslint-disable-next-line no-console -- spike script
    console.log("Pass a test E.164 to exercise import+bind, e.g. +2125...");
    return;
  }

  await importPhoneNumber(number);
  // eslint-disable-next-line no-console -- spike script
  console.log("import ok");

  const agentId = process.env.ASSEMBLYAI_SPIKE_AGENT_ID;
  if (agentId) {
    await bindPhoneNumberAgent(number, agentId);
    // eslint-disable-next-line no-console -- spike script
    console.log("bind ok");
  }
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console -- spike script
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
