"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LlmProvider, SupportedLanguage, VoiceProvider } from "@prisma/client";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { ArabicFlag, DarijaFlag, EnglishFlag, FrenchFlag } from "@/utils/flags";
import { AVATAR_DATA, AnimatedAvatar } from "@/utils/lib/avatars";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

import { LLM_MODELS, groupModels, resolveLlmModelId } from "@/lib/ai/model-registry";
import { VOICE_PERSONAS, getVoicePersonaDetail } from "@/lib/voice/voice-catalog";
import { VoicePickerDialog } from "./VoicePickerDialog";
import {
  updateAgentLanguageSettings,
  updateAgentLlmSettings,
  updateAgentPromptSettings,
  updateAgentVoiceSettings,
} from "@/lib/actions/agents";

import type { AgentDetailWithRelations } from "./agent-detail-types";

type AgentDetailAgentTabProps = {
  agent: AgentDetailWithRelations;
};

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
  { value: SupportedLanguage.ARABIC, label: "Arabic" },
  { value: SupportedLanguage.DARIJA, label: "Darija" },
  { value: SupportedLanguage.FRENCH, label: "French" },
  { value: SupportedLanguage.ENGLISH, label: "English" },
];

function VoiceAvatar({ voiceId, size }: { voiceId: string; size: "row" | "list" }) {
  const direct = AVATAR_DATA.find((a) => a.id === voiceId);
  const avatar =
    direct ??
    (() => {
      if (AVATAR_DATA.length === 0) return undefined;
      let hash = 0;
      for (let i = 0; i < voiceId.length; i++) {
        hash = (hash * 31 + voiceId.charCodeAt(i)) >>> 0;
      }
      return AVATAR_DATA[hash % AVATAR_DATA.length];
    })();
  if (!avatar) return null;
  const px = size === "row" ? 28 : 24;
  return <AnimatedAvatar avatar={avatar} size={px} />;
}

function SelectRow({
  leftIcon,
  title,
  rightPill,
  onClick,
  disabled,
}: {
  leftIcon?: React.ReactNode;
  title: React.ReactNode;
  rightPill?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-3 rounded-md border border-hairline bg-surface-card px-3 py-2 text-left transition-colors hover:bg-canvas-soft disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {leftIcon ?? <div className="h-7 w-7 shrink-0 rounded-md bg-surface-strong" />}
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-ink">{title}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightPill}
        <ChevronRight className="h-4 w-4 text-muted" />
      </div>
    </button>
  );
}

function llmIconSrc(provider: LlmProvider): string {
  switch (provider) {
    case LlmProvider.OPENAI:
      return "/svg/openai-light.svg";
    case LlmProvider.ANTHROPIC:
      return "/svg/claude.svg";
    case LlmProvider.GOOGLE:
      return "/svg/gemini.svg";
    default:
      return "/svg/openai-light.svg";
  }
}

export function AgentDetailAgentTab({ agent }: AgentDetailAgentTabProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [voicesOpen, setVoicesOpen] = useState(false);
  const [llmOpen, setLlmOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const groupedModels = useMemo(() => groupModels(LLM_MODELS), []);

  const [language, setLanguage] = useState<SupportedLanguage>(
    agent.defaultLanguage ?? SupportedLanguage.ENGLISH,
  );

  useEffect(() => {
    setLanguage(agent.defaultLanguage ?? SupportedLanguage.ENGLISH);
  }, [agent.id, agent.defaultLanguage]);

  const voices = useMemo(() => agent.voices ?? [], [agent.voices]);

  const [primaryVoiceId, setPrimaryVoiceId] = useState<string>("");

  useEffect(() => {
    const def = voices.find((v) => v.isPrimary) ?? voices[0];
    setPrimaryVoiceId((prev) => {
      if (prev && (voices.some((v) => v.voiceId === prev) || VOICE_PERSONAS.some((v) => v.voiceId === prev))) {
        return prev;
      }
      return def?.voiceId ?? VOICE_PERSONAS[0]?.voiceId ?? "";
    });
  }, [agent.id, voices]);

  const [llmProvider, setLlmProvider] = useState<LlmProvider>(agent.llmProvider ?? LlmProvider.OPENAI);
  const [llmModel, setLlmModel] = useState<string>(
    resolveLlmModelId(agent.llmModel ?? "openai/gpt-4.1-mini"),
  );

  const [firstMessage, setFirstMessage] = useState<string>(agent.welcomeMessage ?? "");
  const [systemPrompt, setSystemPrompt] = useState<string>(agent.instructions ?? "");

  const languageLabel = (value: SupportedLanguage) =>
    LANGUAGE_OPTIONS.find((o) => o.value === value)?.label ?? String(value);
  const languageIcon = (value: SupportedLanguage): React.ReactNode => {
    const cls = "h-4 w-4";
    switch (value) {
      case SupportedLanguage.ARABIC:
        return <ArabicFlag className={cls} />;
      case SupportedLanguage.DARIJA:
        return <DarijaFlag className={cls} />;
      case SupportedLanguage.FRENCH:
        return <FrenchFlag className={cls} />;
      case SupportedLanguage.ENGLISH:
        return <EnglishFlag className={cls} />;
      default:
        return <span className="text-[12px]">🌐</span>;
    }
  };

  const selectedVoiceDetail = primaryVoiceId ? getVoicePersonaDetail(primaryVoiceId) : undefined;

  async function saveLanguage(nextLanguage: SupportedLanguage) {
    setIsSaving(true);
    try {
      const result = await updateAgentLanguageSettings(agent.id, {
        defaultLanguage: nextLanguage,
        languages: [nextLanguage],
      });
      if (!result.success) {
        toast.error(result.error ?? "Failed to save language settings");
        return;
      }
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function saveLlm(nextProvider: LlmProvider, nextModel: string) {
    setIsSaving(true);
    try {
      const result = await updateAgentLlmSettings(agent.id, {
        llmProvider: nextProvider,
        llmModel: nextModel,
      });
      if (!result.success) {
        toast.error(result.error ?? "Failed to save model settings");
        return;
      }
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function saveVoice(nextVoiceId: string) {
    setIsSaving(true);
    try {
      const selected =
        VOICE_PERSONAS.find((v) => v.voiceId === nextVoiceId) ??
        voices.find((v) => v.voiceId === nextVoiceId);
      if (!selected) return;
      const result = await updateAgentVoiceSettings(agent.id, {
        primaryVoice: {
          provider: VoiceProvider.OPENROUTER,
          voiceId: selected.voiceId,
          name: selected.name,
        },
        additionalVoices: [],
      });
      if (!result.success) {
        toast.error(result.error ?? "Failed to save voice settings");
        return;
      }
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function savePrompts(nextWelcome: string, nextInstructions: string) {
    setIsSaving(true);
    try {
      const result = await updateAgentPromptSettings(agent.id, {
        welcomeMessage: nextWelcome,
        instructions: nextInstructions,
      });
      if (!result.success) {
        toast.error(result.error ?? "Failed to save prompt settings");
        return;
      }
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col gap-6">

        {/* ── Voices ── */}
        <section>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-title-sm text-ink">Voices</h2>
              <p className="mt-0.5 text-body-sm text-muted">Select the voices you want to use for the agent.</p>
            </div>

          </div>
          <div className="mt-3 flex flex-col gap-2">
            <SelectRow
              leftIcon={
                primaryVoiceId ? (
                  <VoiceAvatar voiceId={primaryVoiceId} size="row" />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-md bg-surface-strong" />
                )
              }
              title={
                selectedVoiceDetail ? (
                  <span className="block min-w-0">
                    <span className="block truncate font-medium text-ink">
                      {selectedVoiceDetail.name}
                    </span>
                    <span className="block truncate text-[12px] font-normal text-muted">
                      {selectedVoiceDetail.tagline}
                    </span>
                  </span>
                ) : (
                  "Select voice"
                )
              }
              onClick={() => setVoicesOpen(true)}
              disabled={isSaving}
            />
          </div>
        </section>

        {/* ── LLM ── */}
        <section>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-title-sm text-ink">LLM</h2>
              <p className="mt-0.5 text-body-sm text-muted">Select which provider and model to use for the LLM.</p>
            </div>

          </div>
          <div className="mt-3 flex flex-col gap-2">
            <div>
              <SelectRow
                leftIcon={
                  <Image
                    src={llmIconSrc(llmProvider)}
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-90"
                  />
                }
                title={
                  LLM_MODELS.find((m) => m.provider === llmProvider && m.id === llmModel)?.label ?? llmModel
                }
                onClick={() => setLlmOpen(true)}
                disabled={isSaving}
              />
            </div>
          </div>
        </section>

        {/* ── Language ── */}
        <section>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-title-sm text-ink">Language</h2>
              <p className="mt-0.5 text-body-sm text-muted">
                Choose the language this agent will use in conversations.
              </p>
            </div>

          </div>
          <div className="mt-3 flex flex-col gap-2">
            <SelectRow
              leftIcon={languageIcon(language)}
              title={languageLabel(language)}
              onClick={() => setLanguageOpen(true)}
              disabled={isSaving}
            />
          </div>
        </section>

        {/* ── First message ── */}
        <section>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-title-sm text-ink">First message</h2>
              <p className="mt-0.5 text-body-sm text-muted">
                The first message the agent will say. If empty, the agent will wait for the user.
              </p>
            </div>

          </div>
          <div className="mt-3">
            <Textarea
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              onBlur={() => void savePrompts(firstMessage, systemPrompt)}
              className="min-h-[92px]"
              placeholder="Write the first message…"
            />
          </div>
        </section>

        {/* ── System prompt ── */}
        <section className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-title-sm text-ink">System prompt</h2>
              <p className="mt-0.5 text-body-sm text-muted">
                Defines the agent&apos;s behavior and boundaries.
              </p>
            </div>

          </div>
          <div className="mt-3">
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              onBlur={() => void savePrompts(firstMessage, systemPrompt)}
              className="min-h-[220px] text-[13px] leading-relaxed"
              placeholder="Write the system prompt…"
            />
            <p className="mt-2 text-body-sm text-muted">
              Type <span className="text-ink">{"{{"}</span> to add variables.
            </p>
          </div>
        </section>

      </div>

      <VoicePickerDialog
        open={voicesOpen}
        onOpenChange={setVoicesOpen}
        selectedVoiceId={primaryVoiceId}
        disabled={isSaving}
        onSelect={async (voiceId) => {
          setPrimaryVoiceId(voiceId);
          setVoicesOpen(false);
          await saveVoice(voiceId);
        }}
      />

      {/* ── LLM picker ── */}
      <CommandDialog
        open={llmOpen}
        onOpenChange={setLlmOpen}
        title="LLM"
        description="Select which provider and model to use."
      >
        <Command>
          <CommandInput placeholder="Search models…" />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            {Object.entries(groupedModels).map(([group, models]) => (
              <CommandGroup key={group} heading={group}>
                {models.map((m) => {
                  const active = m.provider === llmProvider && m.id === llmModel;
                  return (
                    <CommandItem
                      key={`${m.provider}:${m.id}`}
                      value={`${m.label} ${m.id}`}
                      onSelect={async () => {
                        setLlmProvider(m.provider);
                        setLlmModel(m.id);
                        setLlmOpen(false);
                        await saveLlm(m.provider, m.id);
                      }}
                    >
                      <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                        <Image
                          src={llmIconSrc(m.provider)}
                          alt=""
                          width={14}
                          height={14}
                          className="opacity-85"
                        />
                      </span>
                      <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                        {active ? <Check className="h-4 w-4" /> : null}
                      </span>
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="truncate">{m.label}</span>
                        <span className="shrink-0 text-[11px] text-muted">{m.id}</span>
                      </span>
                    </CommandItem>
                  );
                })}
                <CommandSeparator />
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>

      {/* ── Language picker ── */}
      <CommandDialog
        open={languageOpen}
        onOpenChange={setLanguageOpen}
        title="Language"
        description="Choose the language this agent will use."
      >
        <Command>
          <CommandInput placeholder="Search languages…" />
          <CommandList>
            <CommandEmpty>No languages found.</CommandEmpty>
            <CommandGroup heading="Languages">
              {LANGUAGE_OPTIONS.map((opt) => {
                const active = opt.value === language;
                return (
                  <CommandItem
                    key={opt.value}
                    value={`${opt.label} ${opt.value}`}
                    onSelect={async () => {
                      setLanguage(opt.value);
                      setLanguageOpen(false);
                      await saveLanguage(opt.value);
                    }}
                  >
                    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                      {languageIcon(opt.value)}
                    </span>
                    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                      {active ? <Check className="h-4 w-4" /> : null}
                    </span>
                    <span>{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}