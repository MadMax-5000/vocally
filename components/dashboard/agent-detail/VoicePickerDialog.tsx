"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckIcon, Pause, Play, SearchIcon } from "@/lib/icons/app-icons"

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AVATAR_DATA, AnimatedAvatar } from "@/utils/lib/avatars";
import {
  VOICE_PERSONA_DETAILS,
  VOICE_PREVIEW_AUDIO_SRC,
  type VoicePersonaDetail,
} from "@/lib/voice/voice-catalog";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type VoicePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVoiceId: string;
  onSelect: (voiceId: string) => void | Promise<void>;
  disabled?: boolean;
};

function VoiceAvatarLarge({ voiceId }: { voiceId: string }) {
  const avatar =
    AVATAR_DATA.find((a) => a.id === voiceId) ??
    (() => {
      let hash = 0;
      for (let i = 0; i < voiceId.length; i++) {
        hash = (hash * 31 + voiceId.charCodeAt(i)) >>> 0;
      }
      return AVATAR_DATA[hash % AVATAR_DATA.length];
    })();
  if (!avatar) return <div className="h-10 w-10 shrink-0 rounded-full bg-surface-strong" />;
  return <AnimatedAvatar avatar={avatar} size={40} />;
}

function VoicePickerRow({
  persona,
  selected,
  previewing,
  disabled,
  onSelect,
  onPreview,
}: {
  persona: VoicePersonaDetail;
  selected: boolean;
  previewing: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onPreview: (e: React.MouseEvent) => void;
}) {
  const t = useTranslations("dashboard.agentDetail.voicePicker");
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!disabled) onSelect();
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors",
        selected ? "bg-surface-strong" : "hover:bg-canvas-soft",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <div className="relative shrink-0">
        <VoiceAvatarLarge voiceId={persona.voiceId} />
        {selected ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-ink text-surface-card ring-2 ring-surface-card"
            aria-hidden
          >
            <AppIcon icon={CheckIcon} className="h-2.5 w-2.5 stroke-[3]" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">
          {persona.name}
          <span className="font-normal text-muted"> — {persona.tagline}</span>
        </p>
        <p className="mt-0.5 truncate text-[12px] text-muted">{persona.description}</p>
      </div>

      <button
        type="button"
        disabled={disabled}
        aria-label={previewing ? t("stopPreview", { name: persona.name }) : t("preview", { name: persona.name })}
        onClick={onPreview}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
      >
        {previewing ? (
          <AppIcon icon={Pause} className="h-4 w-4 fill-current" />
        ) : (
          <AppIcon icon={Play} className="h-4 w-4 fill-current" />
        )}
      </button>
    </div>
  );
}

export function VoicePickerDialog({
  open,
  onOpenChange,
  selectedVoiceId,
  onSelect,
  disabled,
}: VoicePickerDialogProps) {
  const t = useTranslations("dashboard.agentDetail.voicePicker");
  const [query, setQuery] = useState("");
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return VOICE_PERSONA_DETAILS;
    return VOICE_PERSONA_DETAILS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.voiceId.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) {
      audioRef.current?.pause();
      setPreviewingId(null);
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function handlePreview(voiceId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (disabled) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(VOICE_PREVIEW_AUDIO_SRC);
      audioRef.current.onended = () => setPreviewingId(null);
    }

    if (previewingId === voiceId) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPreviewingId(null);
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPreviewingId(voiceId);
    void audioRef.current.play().catch(() => setPreviewingId(null));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(640px,90vh)] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 space-y-1 px-4 pb-2 pt-4">
          <DialogTitle className="text-title-sm">{t("title")}</DialogTitle>
          <DialogDescription className="text-body-sm text-muted">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 px-4 pb-3">
          <div className="flex items-center gap-2 border border-hairline-strong bg-canvas-soft px-3 py-2.5">
            <AppIcon icon={SearchIcon} className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="h-5 w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
              aria-label={t("searchLabel")}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-body-sm text-muted">{t("noResults")}</p>
          ) : (
            <div className="flex flex-col">
              {filtered.map((persona) => (
                <VoicePickerRow
                  key={persona.voiceId}
                  persona={persona}
                  selected={persona.voiceId === selectedVoiceId}
                  previewing={previewingId === persona.voiceId}
                  disabled={disabled}
                  onSelect={() => void onSelect(persona.voiceId)}
                  onPreview={(e) => handlePreview(persona.voiceId, e)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
