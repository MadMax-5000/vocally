"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useMicrophone } from "@/hooks/useMicrophone";

type ChatDeployment = "widget" | "help";

export type UseVoiceToTextOptions = {
  agentId: string;
  widgetToken?: string;
  deployment?: ChatDeployment;
  enabled?: boolean;
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
};

function getMicSupportedSnapshot(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useVoiceToText({
  agentId,
  widgetToken,
  deployment = "widget",
  enabled = true,
  onTranscript,
  onError,
}: UseVoiceToTextOptions) {
  const { stream, requestMic, releaseMic } = useMicrophone();
  const { isRecording, audioBlob, durationMs, startRecording, stopRecording, clear } =
    useAudioRecorder(stream);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const processedBlobRef = useRef<Blob | null>(null);
  const discardNextBlobRef = useRef(false);
  const pendingStartRef = useRef(false);

  const isMicSupported = useSyncExternalStore(
    () => () => {},
    getMicSupportedSnapshot,
    () => false,
  );

  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled || !pendingStartRef.current || !stream) return;
    pendingStartRef.current = false;
    startRecording();
  }, [enabled, stream, startRecording]);

  const cancelRecording = useCallback(() => {
    discardNextBlobRef.current = true;
    pendingStartRef.current = false;
    if (isRecording) {
      stopRecording();
      return;
    }
    clear();
    processedBlobRef.current = null;
    releaseMic();
  }, [isRecording, stopRecording, clear, releaseMic]);

  const handleMicToggle = useCallback(async () => {
    if (!enabled || isTranscribing) return;

    if (isRecording) {
      discardNextBlobRef.current = false;
      stopRecording();
      return;
    }

    if (audioBlob) {
      clear();
    }

    if (!stream) {
      pendingStartRef.current = true;
      await requestMic();
      return;
    }

    startRecording();
  }, [
    enabled,
    isRecording,
    isTranscribing,
    audioBlob,
    stream,
    requestMic,
    startRecording,
    stopRecording,
    clear,
  ]);

  useEffect(() => {
    if (!enabled || !audioBlob || isRecording) return;
    if (processedBlobRef.current === audioBlob) return;

    processedBlobRef.current = audioBlob;

    if (discardNextBlobRef.current) {
      discardNextBlobRef.current = false;
      clear();
      processedBlobRef.current = null;
      releaseMic();
      return;
    }

    let cancelled = false;

    async function transcribe() {
      setIsTranscribing(true);

      try {
        const base64 = await blobToBase64(audioBlob!);
        const format = audioBlob!.type || "audio/webm";

        const res = await fetch("/api/chat/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            ...(widgetToken ? { widgetToken } : {}),
            audio: base64,
            format,
            deployment,
          }),
        });

        const json = await res.json();
        if (cancelled) return;

        if (!json.success) {
          throw new Error(json.error ?? "Transcription failed");
        }

        onTranscriptRef.current(json.data.text);
        clear();
        processedBlobRef.current = null;
      } catch (err) {
        if (!cancelled) {
          onErrorRef.current?.(
            err instanceof Error ? err.message : "Transcription failed",
          );
        }
        clear();
        processedBlobRef.current = null;
      } finally {
        if (!cancelled) {
          setIsTranscribing(false);
          releaseMic();
        }
      }
    }

    void transcribe();

    return () => {
      cancelled = true;
    };
  }, [enabled, audioBlob, isRecording, agentId, widgetToken, deployment, clear, releaseMic]);

  return {
    isMicSupported,
    isRecording,
    isTranscribing,
    durationMs,
    handleMicToggle,
    cancelRecording,
  };
}
