import type { IncomingMessage } from "http";
import type { WebSocket } from "ws";
import { DeepgramClient } from "@deepgram/sdk";
import { processMessage } from "../../lib/ai/process-message";
import { summarizeSession } from "../../lib/ai/summarize-session";
import { resolveAgentVoice } from "../../lib/voice/tts";
import type { DtmfRequest } from "../../lib/ai/tools/handlers";
import { computeRmsEnergy, wavToUlawChunks, synthesizeSpeechWav } from "./audio-utils";
import { getHandoffPhoneNumber, escalateCall } from "./escalate-call";
import { logServerError } from "../../lib/logger";

const BARGE_IN_THRESHOLD = 0.025;

const CONSENT_MESSAGES: Record<string, string> = {
  ar: "قد يتم تسجيل هذه المكالمة لأغراض الجودة والتدريب. كيف يمكنني مساعدتك؟",
  ary: "قد يتم تسجيل هاد المكالمة لأغراض الجودة والتدريب. كيف نقدر نعاونك؟",
  fr: "Cet appel peut être enregistré à des fins de qualité et de formation. Comment puis-je vous aider ?",
  en: "This call may be recorded for quality and training purposes. How can I help you?",
};

function getConsentMessage(language: string): string {
  return CONSENT_MESSAGES[language] ?? CONSENT_MESSAGES.en!;
}

type CallPhase = "IDLE" | "CONSENT" | "LISTENING" | "PROCESSING" | "SPEAKING" | "WAITING_DTMF" | "ESCALATING" | "ENDED";

interface StreamState {
  ws: WebSocket;
  streamSid: string | null;
  callSid: string | null;

  orgId: string | null;
  agentId: string | null;
  sessionId: string | null;
  language: string;

  state: CallPhase;

  dgSocket: Awaited<ReturnType<DeepgramClient["listen"]["v1"]["connect"]>> | null;

  dtmfBuffer: string;
  dtmfRequest: DtmfRequest | null;
  dtmfTimeoutId: ReturnType<typeof setTimeout> | null;

  ttsModel: string;
  ttsVoice: string;
}

function createState(ws: WebSocket): StreamState {
  return {
    ws,
    streamSid: null,
    callSid: null,
    orgId: null,
    agentId: null,
    sessionId: null,
    language: "en",
    state: "IDLE",
    dgSocket: null,
    dtmfBuffer: "",
    dtmfRequest: null,
    dtmfTimeoutId: null,
    ttsModel: "openai/gpt-4o-mini-tts-2025-12-15",
    ttsVoice: "alloy",
  };
}

function isFinalTranscript(data: Record<string, unknown>): string | null {
  if (data.type !== "Results") return null;
  const channel = data.channel as Record<string, unknown> | undefined;
  if (!channel) return null;
  const alts = channel.alternatives as { transcript?: string }[] | undefined;
  if (!alts || alts.length === 0) return null;
  const transcript = alts[0]?.transcript?.trim();
  if (!transcript) return null;
  if (data.is_final !== true) return null;
  return transcript;
}

export function handleMediaStream(ws: WebSocket, _req: IncomingMessage): void {
  const state = createState(ws);

  let currentUtterance = "";
  let dgReady = false;
  let summaryTriggered = false;

  function triggerSummary(): void {
    if (summaryTriggered || !state.sessionId) return;
    summaryTriggered = true;
      summarizeSession(state.sessionId).catch((err) =>
      logServerError("stream.summary_error", { callSid: state.callSid ?? undefined, error: String(err) }),
    );
  }

  async function connectDeepgram(): Promise<void> {
    if (state.dgSocket) return;

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      logServerError("stream.missing_deepgram_key", {});
      return;
    }

    try {
      const client = new DeepgramClient({ apiKey });
      const socket = await client.listen.v1.connect({
        model: "nova-2-phonecall",
        encoding: "mulaw",
        sample_rate: 8000,
        interim_results: "true",
        endpointing: 800,
        language: "multilingual",
        smart_format: "true",
        punctuate: "true",
        Authorization: apiKey,
      });

      socket.on("open", () => {
        dgReady = true;
      });

      socket.on("message", (data) => {
        const raw = data as unknown as Record<string, unknown>;
        const transcript = isFinalTranscript(raw);
        if (transcript) {
          currentUtterance = transcript;
          onFinalUtterance(currentUtterance);
        }
      });

      socket.on("error", (err: Error) => {
        logServerError("stream.deepgram_error", { callSid: state.callSid ?? undefined, error: err.message });
      });

      socket.on("close", () => {
        dgReady = false;
        state.dgSocket = null;
      });

      state.dgSocket = socket;
    } catch (err) {
      logServerError("stream.deepgram_connect_failed", { callSid: state.callSid ?? undefined, error: String(err) });
      state.dgSocket = null;
      dgReady = false;
    }
  }

  function closeDeepgram(): void {
    if (state.dgSocket) {
      try {
        state.dgSocket.close();
      } catch { /* ignore */ }
      state.dgSocket = null;
      dgReady = false;
    }
  }

  function sendToTwilio(payload: Record<string, unknown>): void {
    if (state.ws.readyState === state.ws.OPEN) {
      state.ws.send(JSON.stringify(payload));
    }
  }

  async function onFinalUtterance(transcript: string): Promise<void> {
    if (state.state === "PROCESSING" || state.state === "ENDED" || state.state === "CONSENT") return;
    state.state = "PROCESSING";

    try {
      const result = await processMessage({
        orgId: state.orgId!,
        agentId: state.agentId!,
        sessionId: state.sessionId!,
        message: transcript,
        channel: "VOICE",
      });

      currentUtterance = "";
      const { botContent, escalation, dtmfRequest } = result;

      if (escalation) {
        await handleEscalation();
        return;
      }

      await speakToCaller(botContent);

      if (dtmfRequest) {
        await startDtmfCollection(dtmfRequest);
        return;
      }
    } catch (err) {
      logServerError("stream.process_message_error", { callSid: state.callSid ?? undefined, error: String(err) });
      await speakToCaller("I'm sorry, I'm having trouble processing that.");
    } finally {
      if (
        state.state !== ("ENDED" as CallPhase) &&
        state.state !== ("WAITING_DTMF" as CallPhase) &&
        state.state !== ("ESCALATING" as CallPhase)
      ) {
        state.state = "LISTENING";
      }
    }
  }

  let ttsAborted = false;

  async function speakToCaller(text: string): Promise<void> {
    state.state = "SPEAKING";
    ttsAborted = false;

    try {
      const wavBuffer = await synthesizeSpeechWav(
        text,
        state.ttsVoice,
        state.ttsModel,
      );

      const chunks = wavToUlawChunks(wavBuffer);

      for (const chunk of chunks) {
        if (ttsAborted || state.state === ("ENDED" as CallPhase)) break;

        sendToTwilio({
          event: "media",
          streamSid: state.streamSid,
          media: { payload: chunk.toString("base64") },
        });
      }

      if (!ttsAborted && state.state !== ("ENDED" as CallPhase)) {
        sendToTwilio({
          event: "mark",
          streamSid: state.streamSid,
          mark: { name: "ttsComplete" },
        });
      }
    } catch (err) {
      logServerError("stream.tts_error", { callSid: state.callSid ?? undefined, error: String(err) });
    }

    if (state.state !== ("ENDED" as CallPhase)) {
      state.state = "LISTENING";
    }
  }

  async function playConsent(): Promise<void> {
    ttsAborted = false;
    const text = getConsentMessage(state.language);
    try {
      const wavBuffer = await synthesizeSpeechWav(
        text,
        state.ttsVoice,
        state.ttsModel,
      );
      const chunks = wavToUlawChunks(wavBuffer);

      for (const chunk of chunks) {
        if (ttsAborted || state.state === "ENDED") break;
        sendToTwilio({
          event: "media",
          streamSid: state.streamSid,
          media: { payload: chunk.toString("base64") },
        });
      }

      if (!ttsAborted && state.state !== "ENDED") {
        sendToTwilio({
          event: "mark",
          streamSid: state.streamSid,
          mark: { name: "consentComplete" },
        });
      }
    } catch (err) {
      logServerError("stream.consent_tts_error", { callSid: state.callSid ?? undefined, error: String(err) });
    }

    if (state.state === "CONSENT") {
      await connectDeepgram();
      state.state = "LISTENING";
    }
  }

  // ── DTMF Collection ──────────────────────────────────────────────────

  async function startDtmfCollection(request: DtmfRequest): Promise<void> {
    state.dtmfBuffer = "";
    state.dtmfRequest = request;
    state.state = "WAITING_DTMF";

    if (state.dtmfTimeoutId) clearTimeout(state.dtmfTimeoutId);
    state.dtmfTimeoutId = setTimeout(() => {
      finishDtmfCollection();
    }, 15_000);
  }

  function cancelDtmfCollection(): void {
    if (state.dtmfTimeoutId) {
      clearTimeout(state.dtmfTimeoutId);
      state.dtmfTimeoutId = null;
    }
    state.dtmfBuffer = "";
    state.dtmfRequest = null;
  }

  async function finishDtmfCollection(digits?: string): Promise<void> {
    const collected = digits ?? state.dtmfBuffer;
    cancelDtmfCollection();

    if (!collected) {
      await speakToCaller("I didn't receive any keypad input. Let me try something else.");
      return;
    }

    state.state = "PROCESSING";

    try {
      const result = await processMessage({
        orgId: state.orgId!,
        agentId: state.agentId!,
        sessionId: state.sessionId!,
        message: collected,
        channel: "VOICE",
      });

      if (result.escalation) {
        await handleEscalation();
        return;
      }

      await speakToCaller(result.botContent);
    } catch (err) {
      logServerError("stream.dtmf_process_message_error", { callSid: state.callSid ?? undefined, error: String(err) });
      await speakToCaller("I'm sorry, I had trouble processing that input.");
    }
  }

  async function handleDtmfDigit(digit: string): Promise<void> {
    if (state.state !== "WAITING_DTMF" || !state.dtmfRequest) return;

    if (digit === state.dtmfRequest.finishOnKey) {
      await finishDtmfCollection();
      return;
    }

    state.dtmfBuffer += digit;

    if (state.dtmfBuffer.length >= state.dtmfRequest.maxDigits) {
      await finishDtmfCollection();
    }
  }

  // ── Escalation ────────────────────────────────────────────────────────

  async function handleEscalation(): Promise<void> {
    state.state = "ESCALATING";
    closeDeepgram();
    cancelDtmfCollection();

    try {
      const handoffPhone = await getHandoffPhoneNumber(state.agentId);
      const updated = await escalateCall({
        callSid: state.callSid!,
        handoffPhone,
        message:
          "Please hold while I transfer you to a human agent. Please stay on the line.",
      });

      if (!updated) {
        await speakToCaller(
          "I'm sorry, I'm having trouble connecting you. Please try again later.",
        );
      }
    } catch (err) {
      logServerError("stream.escalation_error", { callSid: state.callSid ?? undefined, error: String(err) });
      await speakToCaller(
        "I'm sorry, I'm unable to transfer you at this time.",
      );
    }
  }

  // ── WebSocket message handler ────────────────────────────────────────

  ws.on("message", (raw: Buffer) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const event = msg.event as string;

    switch (event) {
      case "connected":
        state.streamSid = msg.streamSid as string;
        break;

      case "start": {
        const start = msg as {
          streamSid: string;
          callSid: string;
          customParameters?: Record<string, string>;
        };
        state.streamSid = start.streamSid;
        state.callSid = start.callSid;
        state.orgId = start.customParameters?.orgId ?? null;
        state.agentId = start.customParameters?.agentId ?? null;
        state.sessionId = start.customParameters?.sessionId ?? null;

        resolveAgentVoice(state.agentId, state.language)
          .then((voice) => {
            state.ttsModel = voice.model;
            state.ttsVoice = voice.voice;
          })
          .catch(() => {
            /* keep defaults */
          });

        state.state = "CONSENT";
        playConsent();
        break;
      }

      case "media": {
        if (state.state === "ENDED") return;

        const payload = (msg.media as { payload: string }).payload;
        const audioBuffer = Buffer.from(payload, "base64");

        if (state.state === "CONSENT") {
          const energy = computeRmsEnergy(audioBuffer);
          if (energy > BARGE_IN_THRESHOLD) {
            ttsAborted = true;
            sendToTwilio({
              event: "clear",
              streamSid: state.streamSid,
            });
            connectDeepgram();
            state.state = "LISTENING";
          }
          break;
        }

        if (state.state === "SPEAKING") {
          const energy = computeRmsEnergy(audioBuffer);
          if (energy > BARGE_IN_THRESHOLD) {
            ttsAborted = true;
            sendToTwilio({
              event: "clear",
              streamSid: state.streamSid,
            });
            state.state = "LISTENING";
          }
        }

        if (state.state === "WAITING_DTMF") {
          break;
        }

        if (state.state === "LISTENING" && dgReady && state.dgSocket) {
          state.dgSocket.sendMedia(audioBuffer);
        }
        break;
      }

      case "dtmf": {
        const digit = (msg.dtmf as { digit: string } | undefined)?.digit;
        if (digit) {
          handleDtmfDigit(digit);
        }
        break;
      }

      case "mark": {
        break;
      }

      case "stop": {
        state.state = "ENDED";
        cancelDtmfCollection();
        closeDeepgram();
        triggerSummary();
        break;
      }
    }
  });

  ws.on("close", () => {
    state.state = "ENDED";
    cancelDtmfCollection();
    closeDeepgram();
    triggerSummary();
  });

  ws.on("error", (err) => {
    logServerError("stream.ws_error", { callSid: state.callSid ?? undefined, error: err.message });
    state.state = "ENDED";
    cancelDtmfCollection();
    closeDeepgram();
  });
}
