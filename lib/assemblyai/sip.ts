/**
 * Phone SIP strategy for AssemblyAI.
 *
 * Decision (spike): use native SIP. AssemblyAI documents inbound audio at
 * sip:sip.assemblyai.com. PBXme already SIP-forwards Moroccan DIDs; we retarget
 * that forward from Vapi to this URI.
 *
 * LiveKit SIP↔WebSocket bridge is the fallback only if phone-numbers/import
 * rejects a non-Twilio termination_uri and audio never connects. Do not build
 * the bridge until that failure is confirmed on a test DID.
 */

export const ASSEMBLYAI_SIP_HOST = "sip.assemblyai.com";
export const ASSEMBLYAI_SIP_URI = `sip:${ASSEMBLYAI_SIP_HOST}`;
/** Value sent as termination_uri on POST /v1/phone-numbers/import. */
export const ASSEMBLYAI_TERMINATION_URI = ASSEMBLYAI_SIP_HOST;

export type AssemblyAiSipStrategy = "native" | "livekit-bridge";

export function getAssemblyAiSipStrategy(): AssemblyAiSipStrategy {
  return "native";
}
