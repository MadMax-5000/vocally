"use client";

import { useEffect, useState } from "react";

const CHAR_MS = 28;

export function useTypewriter(text: string, active: boolean, reduceMotion: boolean) {
  const [shown, setShown] = useState(reduceMotion ? text : "");
  const [done, setDone] = useState(reduceMotion);

  useEffect(() => {
    if (!active) {
      setShown("");
      setDone(false);
      return;
    }

    if (reduceMotion) {
      setShown(text);
      setDone(true);
      return;
    }

    const chars = Array.from(text);
    setShown("");
    setDone(false);
    let i = 0;

    const id = window.setInterval(() => {
      i += 1;
      setShown(chars.slice(0, i).join(""));
      if (i >= chars.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, CHAR_MS);

    return () => window.clearInterval(id);
  }, [active, reduceMotion, text]);

  return { shown, done };
}
