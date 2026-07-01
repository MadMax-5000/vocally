"use client";

import type { IconSvgElement } from "@/components/ui/app-icon";
import { AgentTone } from "@prisma/client";
import {
  BriefcaseIcon,
  Crown,
  HandHeart,
  HandWavingIcon,
  HeartStraightIcon,
  Lightning,
  MessageCircle,
  MoonStar,
  PenLineIcon,
  ScalesIcon,
  ShieldCheck,
  Sparkle,
} from "@/lib/icons/app-icons";

import { CustomCard } from "@/components/onboarding/CustomCard";
import { SelectableCard } from "@/components/onboarding/SelectableCard";
import { InlineCustomForm } from "@/components/onboarding/InlineCustomForm";

const TONE_OPTIONS: {
  value: AgentTone;
  label: string;
  icon: IconSvgElement;
}[] = [
  {
    value: "PROFESSIONAL",
    label: "Professional",
    icon: BriefcaseIcon,
  },
  {
    value: "FRIENDLY",
    label: "Friendly",
    icon: HandWavingIcon,
  },
  {
    value: "LUXURY",
    label: "Luxury",
    icon: Crown,
  },
  {
    value: "FAST_CONCISE",
    label: "Fast & concise",
    icon: Lightning,
  },
  {
    value: "EMPATHETIC",
    label: "Empathetic",
    icon: HeartStraightIcon,
  },
  {
    value: "ENERGETIC",
    label: "Energetic",
    icon: Sparkle,
  },
  {
    value: "CALM",
    label: "Calm",
    icon: MoonStar,
  },
  {
    value: "CONFIDENT",
    label: "Confident",
    icon: ShieldCheck,
  },
  {
    value: "CONVERSATIONAL",
    label: "Conversational",
    icon: MessageCircle,
  },
  {
    value: "FORMAL",
    label: "Formal",
    icon: ScalesIcon,
  },
  {
    value: "SUPPORTIVE",
    label: "Supportive",
    icon: HandHeart,
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
        <h1 className="text-display-sm font-display tracking-tight text-ink text-balance">
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
            icon={opt.icon}
            selected={!toneIsCustom && tone === opt.value}
            onClick={() => onPickPreset(opt.value)}
          />
        ))}
        <CustomCard
          title="Custom"
          icon={PenLineIcon}
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
