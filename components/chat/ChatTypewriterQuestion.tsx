"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const TYPE_INTERVAL_MS = 32;
const DELETE_INTERVAL_MS = 16;
const HOLD_INTERVAL_MS = 1_800;
const BETWEEN_QUESTIONS_MS = 260;

type ChatTypewriterQuestionProps = {
  questions: string[];
  fallback: string;
  className?: string;
};

/**
 * Types the launcher placeholder like a person writing a message.
 * The parent pill reserves the width of the longest question, so the
 * typewriter never changes the pill's size or position.
 */
export function ChatTypewriterQuestion({
  questions,
  fallback,
  className,
}: ChatTypewriterQuestionProps) {
  const slides = questions.length > 0 ? questions : [fallback];
  const slidesKey = slides.join("\u0000");
  const firstSlide = slides[0] ?? fallback;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">(
    "typing",
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setIndex(0);
    setText("");
    setPhase("typing");
  }, [slidesKey]);

  useEffect(() => {
    if (!reduceMotion) return;
    setText(firstSlide);
    setPhase("holding");
  }, [reduceMotion, firstSlide]);

  const active = slides[index] ?? fallback;

  useEffect(() => {
    if (reduceMotion || paused) return;

    let timer: number | undefined;

    if (phase === "typing") {
      if (text.length < active.length) {
        timer = window.setTimeout(
          () => setText(active.slice(0, text.length + 1)),
          TYPE_INTERVAL_MS,
        );
      } else if (slides.length > 1) {
        timer = window.setTimeout(
          () => setPhase("holding"),
          HOLD_INTERVAL_MS,
        );
      }
    } else if (phase === "holding") {
      if (slides.length > 1) {
        timer = window.setTimeout(() => setPhase("deleting"), 0);
      }
    } else if (text.length > 0) {
      timer = window.setTimeout(
        () => setText(active.slice(0, text.length - 1)),
        DELETE_INTERVAL_MS,
      );
    } else {
      timer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % slides.length);
        setPhase("typing");
      }, BETWEEN_QUESTIONS_MS);
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [reduceMotion, paused, phase, text, active, slides.length]);

  return (
    <span
      aria-hidden
      dir="auto"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className={cn(
        "block min-w-0 flex-1 truncate text-start text-[14px] font-medium leading-5 text-muted",
        className,
      )}
    >
      {text}
      {!reduceMotion ? <span className="chat-typewriter-caret" /> : null}
    </span>
  );
}
