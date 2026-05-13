"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type AudioPlayerState = {
  isPlaying: boolean;
  play: (base64: string, format?: string) => void;
  playUrl: (url: string) => void;
  stop: () => void;
};

export function useAudioPlayer(): AudioPlayerState {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const play = useCallback(
    (base64: string, format: string = "audio/mpeg") => {
      stop();

      const dataUri = `data:${format};base64,${base64}`;
      const audio = new Audio(dataUri);
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);

      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    },
    [stop],
  );

  const playUrl = useCallback(
    (url: string) => {
      stop();

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);

      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    },
    [stop],
  );

  return { isPlaying, play, playUrl, stop };
}
