"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type MicrophoneState = {
  stream: MediaStream | null;
  isMicEnabled: boolean;
  error: string | null;
  requestMic: () => Promise<void>;
  releaseMic: () => void;
};

export function useMicrophone(): MicrophoneState {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const releaseMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const requestMic = useCallback(async () => {
    if (streamRef.current) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Browser does not support microphone access");
      return;
    }

    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = ms;
      setStream(ms);
      setError(null);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone permissions."
          : err instanceof Error
            ? err.message
            : "Failed to access microphone";
      setError(message);
    }
  }, []);

  return {
    stream,
    isMicEnabled: streamRef.current !== null,
    error,
    requestMic,
    releaseMic,
  };
}
