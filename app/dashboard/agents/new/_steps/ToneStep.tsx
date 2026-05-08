"use client";

import { AgentTone } from "@prisma/client";
import {
  Feather,
  Gem,
  PenLine,
  Rocket,
  Shield,
  Smile,
  Zap,
} from "lucide-react";
import {
  Briefcase,
  HandWaving,
  Crown,
  Lightning,
  HeartStraight,
  Sparkle,
  MoonStars,
  ShieldCheck,
  ChatCenteredText,
  Scales,
  LifebuoyIcon,
  HandHeartIcon,
} from "@phosphor-icons/react";

import { CustomCard } from "@/components/onboarding/CustomCard";
import { SelectableCard } from "@/components/onboarding/SelectableCard";
import { InlineCustomForm } from "@/components/onboarding/InlineCustomForm";

const TONE_OPTIONS: {
  value: AgentTone;
  label: string;
  Icon: typeof Shield;
}[] = [
  {
    value: "PROFESSIONAL",
    label: "Professional",
    Icon: Briefcase,
  },
  {
    value: "FRIENDLY",
    label: "Friendly",
    Icon: HandWaving,
  },
  {
    value: "LUXURY",
    label: "Luxury",
    Icon: Crown,
  },
  {
    value: "FAST_CONCISE",
    label: "Fast & concise",
    Icon: Lightning,
  },
  {
    value: "EMPATHETIC",
    label: "Empathetic",
    Icon: HeartStraight,
  },
  {
    value: "ENERGETIC",
    label: "Energetic",
    Icon: Sparkle,
  },
  {
    value: "CALM",
    label: "Calm",
    Icon: MoonStars,
  },
  {
    value: "CONFIDENT",
    label: "Confident",
    Icon: ShieldCheck,
  },
  {
    value: "CONVERSATIONAL",
    label: "Conversational",
    Icon: ChatCenteredText,
  },
  {
    value: "FORMAL",
    label: "Formal",
    Icon: Scales,
  },
  {
    value: "SUPPORTIVE",
    label: "Supportive",
    Icon: HandHeartIcon,
  },
];

type ToneStepProps = {
  tone: AgentTone | null;
  toneIsCustom: boolean;
  customTone: string;
  onPickPreset: (value: AgentTone) => void;
  onPickCustom: () => void;
  onCustomToneChange: (value: string) => void;
  onContinueCustom: () => void;
};

export function ToneStep({
  tone,
  toneIsCustom,
  customTone,
  onPickPreset,
  onPickCustom,
  onCustomToneChange,
  onContinueCustom,
}: ToneStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-display-sm font-display font-bold tracking-tight text-ink text-balance">
          How should your agent sound?
        </h1>
        <p className="max-w-xl text-body-sm leading-relaxed text-muted">
          Choose a default voice. You can fine-tune wording later in settings.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TONE_OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            title={opt.label}
            icon={opt.Icon}
            selected={!toneIsCustom && tone === opt.value}
            onClick={() => onPickPreset(opt.value)}
          />
        ))}
        <CustomCard
          title="Custom"
          icon={PenLine}
          selected={toneIsCustom}
          onSelect={onPickCustom}
        />
      </div>

      {toneIsCustom ? (
        <InlineCustomForm
          id="custom-tone"
          label="Custom tone"
          placeholder="Describe tone..."
          helper="Describe the exact style you want (e.g. “warm Darija, short sentences”)."
          value={customTone}
          onChange={onCustomToneChange}
          onContinue={onContinueCustom}
        />
      ) : null}
    </div>
  );
}
