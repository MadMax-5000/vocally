"use client";

import { useEffect, useMemo, useState } from "react";
import { LlmProvider, SupportedLanguage } from "@prisma/client";
import { Check, ChevronRight, Plus } from "lucide-react";
import Image from "next/image";

import { DarijaFlag, EnglishFlag, FrenchFlag } from "@/utils/flags";
import { AVATAR_DATA, AnimatedAvatar } from "@/utils/lib/avatars";
import { Label } from "@/components/ui/label";
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

import { Button } from "@/components/ui/button";
import { LLM_MODELS, groupModels } from "@/lib/ai/model-registry";
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
  { value: SupportedLanguage.ENGLISH, label: "English" },
  { value: SupportedLanguage.FRENCH, label: "French" },
  { value: SupportedLanguage.DARIJA, label: "Darija" },
];

function Pill({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "primary";
}) {
  if (variant === "primary") {
    return (
      <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-[2px] text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/20">
        {children}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-surface-strong px-2.5 py-[2px] text-[11px] font-semibold text-ink ring-1 ring-inset ring-hairline-strong">
      {children}
    </span>
  );
}

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
  const [isSaving, setIsSaving] = useState(false);

  const [voicesOpen, setVoicesOpen] = useState(false);
  const [llmOpen, setLlmOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const groupedModels = useMemo(() => groupModels(LLM_MODELS), []);

  const initialLanguages = useMemo<SupportedLanguage[]>(
    () => agent.languages.map((l) => l.language),
    [agent.languages]
  );

  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguage>(
    agent.defaultLanguage ?? SupportedLanguage.ENGLISH
  );
  const [selectedLanguages, setSelectedLanguages] =
    useState<SupportedLanguage[]>(initialLanguages.length > 0 ? initialLanguages : [defaultLanguage]);

  const voices = useMemo(() => agent.voices ?? [], [agent.voices]);

  const [primaryVoiceId, setPrimaryVoiceId] = useState<string>("");

  useEffect(() => {
    const def = voices.find((v) => v.isPrimary) ?? voices[0];
    setPrimaryVoiceId((prev) => {
      if (prev && voices.some((v) => v.voiceId === prev)) return prev;
      return def?.voiceId ?? "";
    });
  }, [agent.id, voices]);

  const [llmProvider, setLlmProvider] = useState<LlmProvider>(agent.llmProvider ?? LlmProvider.ANTHROPIC);
  const [llmModel, setLlmModel] = useState<string>(agent.llmModel ?? "anthropic/claude-haiku-4.5");

  const [firstMessage, setFirstMessage] = useState<string>(agent.welcomeMessage ?? "");
  const [systemPrompt, setSystemPrompt] = useState<string>(agent.instructions ?? "");

  useEffect(() => {
    if (!selectedLanguages.includes(defaultLanguage)) {
      setSelectedLanguages((prev) => [defaultLanguage, ...prev]);
    }
  }, [defaultLanguage, selectedLanguages]);

  const languageLabel = (value: SupportedLanguage) =>
    LANGUAGE_OPTIONS.find((o) => o.value === value)?.label ?? String(value);
  const languageIcon = (value: SupportedLanguage): React.ReactNode => {
    const cls = "h-4 w-4";
    switch (value) {
      case SupportedLanguage.ENGLISH:
        return <EnglishFlag className={cls} />;
      case SupportedLanguage.FRENCH:
        return <FrenchFlag className={cls} />;
      case SupportedLanguage.DARIJA:
        return <DarijaFlag className={cls} />;
      default:
        return <span className="text-[12px]">🌐</span>;
    }
  };

  const primaryVoiceName =
    voices.find((v) => v.voiceId === primaryVoiceId)?.name ??
    (primaryVoiceId ? primaryVoiceId : "Select voice");

  async function saveLanguage(nextDefault: SupportedLanguage, nextLanguages: SupportedLanguage[]) {
    setIsSaving(true);
    try {
      const result = await updateAgentLanguageSettings(agent.id, {
        defaultLanguage: nextDefault,
        languages: nextLanguages,
      });
      if (!result.success) {
        // keep UI optimistic for now
      }
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
        // optimistic for now
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function saveVoice(nextVoiceId: string) {
    setIsSaving(true);
    try {
      const dbVoice = voices.find((v) => v.voiceId === nextVoiceId);
      if (!dbVoice) return;
      const result = await updateAgentVoiceSettings(agent.id, {
        primaryVoice: {
          provider: dbVoice.provider,
          voiceId: nextVoiceId,
          name: dbVoice.name,
        },
        additionalVoices: [],
      });
      if (!result.success) {
        // optimistic for now
      }
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
        // optimistic for now
      }
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
            <div>
              <Label className="mb-1.5 text-body-sm text-muted">Primary</Label>
              <SelectRow
                leftIcon={
                  primaryVoiceId ? (
                    <VoiceAvatar voiceId={primaryVoiceId} size="row" />
                  ) : (
                    <div className="h-7 w-7 shrink-0 rounded-md bg-surface-strong" />
                  )
                }
                title={primaryVoiceName}
                rightPill={<Pill variant="primary">Primary</Pill>}
                onClick={() => setVoicesOpen(true)}
                disabled={isSaving}
              />
            </div>
            <button
              type="button"
              disabled
              className="flex w-full items-center gap-2 rounded-md border border-hairline bg-canvas-soft px-3 py-2 text-[13px] text-muted"
            >
              <Plus className="h-4 w-4" />
              Add additional voice
            </button>
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
                Choose the default and additional languages the agent will communicate in.
              </p>
            </div>

          </div>
          <div className="mt-3 flex flex-col gap-2">
            <div>
              <SelectRow
                leftIcon={languageIcon(defaultLanguage)}
                title={languageLabel(defaultLanguage)}
                rightPill={<Pill>Default</Pill>}
                onClick={() => setLanguageOpen(true)}
                disabled={isSaving}
              />
            </div>
            <button
              type="button"
              onClick={() => setLanguageOpen(true)}
              disabled={isSaving}
              className="flex w-full items-center gap-2 rounded-md border border-hairline bg-canvas-soft px-3 py-2 text-[13px] text-muted transition-colors hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add additional languages
            </button>
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
                Defines the agent's behavior and boundaries.
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

      {/* ── Voices picker ── */}
      <CommandDialog
        open={voicesOpen}
        onOpenChange={setVoicesOpen}
        title="Voices"
        description="Pick a voice already linked to this agent."
      >
        <Command>
          <CommandInput placeholder="Search voices…" />
          <CommandList>
            <CommandEmpty>
              No voices configured for this agent yet.
            </CommandEmpty>
            <CommandGroup heading="Agent voices">
              {voices.map((v) => {
                const active = v.voiceId === primaryVoiceId;
                return (
                  <CommandItem
                    key={v.id}
                    value={`${v.name} ${v.voiceId}`}
                    onSelect={async () => {
                      setPrimaryVoiceId(v.voiceId);
                      setVoicesOpen(false);
                      await saveVoice(v.voiceId);
                    }}
                  >
                    <span className="mr-2 inline-flex">
                      <VoiceAvatar voiceId={v.voiceId} size="list" />
                    </span>
                    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                      {active ? <Check className="h-4 w-4" /> : null}
                    </span>
                    <span>{v.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

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
        description="Choose the default and additional languages."
      >
        <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1">
          <div className="text-[12px] text-muted">
            Selected: <span className="text-ink">{selectedLanguages.length}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={isSaving || selectedLanguages.length === 0}
            onClick={async () => {
              await saveLanguage(defaultLanguage, selectedLanguages);
              setLanguageOpen(false);
            }}
          >
            Save
          </Button>
        </div>

        <Command>
          <CommandInput placeholder="Search languages…" />
          <CommandList>
            <CommandEmpty>No languages found.</CommandEmpty>
            <CommandGroup heading="Default">
              {LANGUAGE_OPTIONS.map((opt) => {
                const active = opt.value === defaultLanguage;
                return (
                  <CommandItem
                    key={`default:${opt.value}`}
                    value={opt.label}
                    onSelect={() => {
                      setDefaultLanguage(opt.value);
                      if (!selectedLanguages.includes(opt.value)) {
                        setSelectedLanguages((prev) => [opt.value, ...prev]);
                      }
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

            <CommandSeparator />

            <CommandGroup heading="Additional languages">
              {LANGUAGE_OPTIONS.map((opt) => {
                const checked = selectedLanguages.includes(opt.value);
                const isDefault = opt.value === defaultLanguage;
                return (
                  <CommandItem
                    key={`extra:${opt.value}`}
                    value={`extra ${opt.label}`}
                    onSelect={() => {
                      if (isDefault) return;
                      setSelectedLanguages((prev) => {
                        if (prev.includes(opt.value)) {
                          return prev.filter((x) => x !== opt.value);
                        }
                        return [...prev, opt.value];
                      });
                    }}
                  >
                    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                      {languageIcon(opt.value)}
                    </span>
                    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                      {checked ? <Check className="h-4 w-4" /> : null}
                    </span>
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="truncate">{opt.label}</span>
                      {isDefault ? <Pill>Default</Pill> : null}
                    </span>
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