"use client";

import { useState, useCallback, useRef } from "react";

export type AudioRecorderState = {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationMs: number;
  startRecording: () => void;
  stopRecording: () => void;
  clear: () => void;
};

function getSupportedMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function useAudioRecorder(stream: MediaStream | null): AudioRecorderState {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDurationMs(0);
  }, [audioUrl]);

  const startRecording = useCallback(() => {
    if (!stream) return;

    clear();
    chunksRef.current = [];

    const mimeType = getSupportedMimeType();
    const options: MediaRecorderOptions = {};
    if (mimeType) options.mimeType = mimeType;

    try {
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setIsRecording(false);
      };

      recorder.onerror = () => {
        setIsRecording(false);
      };

      recorder.start(250);
      setIsRecording(true);
      startTimeRef.current = Date.now();
      setDurationMs(0);

      timerRef.current = setInterval(() => {
        setDurationMs(Date.now() - startTimeRef.current);
      }, 200);
    } catch {
      setIsRecording(false);
    }
  }, [stream, clear]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    durationMs,
    startRecording,
    stopRecording,
    clear,
  };
}
