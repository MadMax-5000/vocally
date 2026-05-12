"use client";

import { Play, Pause, Download } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function sentimentLabel(score: number | null): { label: string; color: string } {
  if (score == null) return { label: "—", color: "text-muted-soft" };
  if (score >= 0.3) return { label: "Positive", color: "text-emerald-600" };
  if (score >= -0.3) return { label: "Neutral", color: "text-amber-600" };
  return { label: "Negative", color: "text-red-600" };
}

/* ------------------------------------------------------------------
   AudioPlayer
   ------------------------------------------------------------------ */

function AudioPlayer({ src }: { src: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-card p-3">
      <audio
        controls
        src={src}
        className="w-full h-10 [&::-webkit-media-controls-panel]:bg-surface-card"
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

/* ------------------------------------------------------------------
   MetricBadge
   ------------------------------------------------------------------ */

function MetricBadge({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5 rounded-xl border border-hairline bg-surface-card px-4 py-3", className)}>
      <span className="text-[11px] font-medium text-muted-soft uppercase tracking-wider">
        {label}
      </span>
      <span className="text-body-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------
   TranscriptLine
   ------------------------------------------------------------------ */

function TranscriptLine({
  time,
  speaker,
  text,
}: {
  time: string;
  speaker: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 px-3 py-1.5 text-body-sm hover:bg-canvas-soft/50 rounded-lg transition-colors">
      <span className="shrink-0 w-12 text-[11px] tabular-nums text-muted-soft pt-0.5">
        {time}
      </span>
      <span className="shrink-0 w-14 text-[11px] font-semibold uppercase tracking-wider text-muted pt-0.5">
        {speaker}
      </span>
      <span className="text-ink">{text}</span>
    </div>
  );
}

/* ------------------------------------------------------------------
   VoiceCallView
   ------------------------------------------------------------------ */

export function VoiceCallView({
  recordingUrl,
  transcript,
  summary,
  duration,
  sentiment,
  qaScore,
}: {
  recordingUrl: string | null;
  transcript: string | null;
  summary: string | null;
  duration: number | null;
  sentiment: number | null;
  qaScore: number | null;
}) {
  const parsedTranscript = transcript
    ? parseTranscript(transcript)
    : null;

  const sent = sentimentLabel(sentiment);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary card */}
      {summary && (
        <div className="rounded-xl border border-hairline bg-surface-card p-4">
          <h3 className="text-caption-uppercase text-muted mb-2">AI Summary</h3>
          <p className="text-body-sm text-ink leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Audio Player */}
      {recordingUrl && (
        <div>
          <h3 className="text-caption-uppercase text-muted mb-2">Recording</h3>
          <AudioPlayer src={recordingUrl} />
        </div>
      )}

      {/* Metrics */}
      <div>
        <h3 className="text-caption-uppercase text-muted mb-2">Metrics</h3>
        <div className="grid grid-cols-4 gap-2">
          <MetricBadge
            label="Duration"
            value={formatDuration(duration)}
          />
          <MetricBadge
            label="Sentiment"
            value={
              <span className={sent.color}>{sent.label}</span>
            }
          />
          <MetricBadge
            label="QA Score"
            value={qaScore != null ? `${Math.round(qaScore)}%` : "—"}
          />
          <MetricBadge
            label="Messages"
            value={parsedTranscript?.length ?? "—"}
          />
        </div>
      </div>

      {/* Transcript */}
      {parsedTranscript && parsedTranscript.length > 0 && (
        <div>
          <h3 className="text-caption-uppercase text-muted mb-2">Transcript</h3>
          <div className="rounded-xl border border-hairline bg-surface-card py-2">
            {parsedTranscript.map((line, i) => (
              <TranscriptLine
                key={i}
                time={line.time}
                speaker={line.speaker}
                text={line.text}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Transcript parser — handles common transcript formats
   ------------------------------------------------------------------ */

type TranscriptLineData = {
  time: string;
  speaker: string;
  text: string;
};

function parseTranscript(raw: string): TranscriptLineData[] {
  const lines = raw.trim().split("\n");
  const result: TranscriptLineData[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try [MM:SS] or [H:MM:SS] pattern
    const bracketMatch = trimmed.match(
      /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)/,
    );
    if (bracketMatch) {
      const time = bracketMatch[1];
      const rest = bracketMatch[2].trim();
      // Try to extract speaker from the rest: "Speaker: Text" or "SPEAKER: Text"
      const speakerMatch = rest.match(/^([A-Za-z0-9_]+):\s*(.*)/);
      if (speakerMatch) {
        result.push({
          time,
          speaker: speakerMatch[1],
          text: speakerMatch[2],
        });
      } else {
        result.push({ time, speaker: "—", text: rest });
      }
      continue;
    }

    // Try "MM:SS Speaker: Text" pattern
    const prefixMatch = trimmed.match(
      /^(\d{1,2}:\d{2}(?::\d{2})?)\s+([A-Za-z0-9_]+):\s*(.*)/,
    );
    if (prefixMatch) {
      result.push({
        time: prefixMatch[1],
        speaker: prefixMatch[2],
        text: prefixMatch[3],
      });
      continue;
    }

    // Fallback: treat as plain text with no timestamp
    result.push({ time: "", speaker: "", text: trimmed });
  }

  return result;
}
