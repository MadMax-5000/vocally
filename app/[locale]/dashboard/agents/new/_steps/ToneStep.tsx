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
import { useTranslations } from "next-intl";

const TONE_OPTIONS: { value: AgentTone; key: string; icon: IconSvgElement }[] = [
  {
    value: "PROFESSIONAL",
    key: "professional",
    icon: BriefcaseIcon,
  },
  {
    value: "FRIENDLY",
    key: "friendly",
    icon: HandWavingIcon,
  },
  {
    value: "LUXURY",
    key: "luxury",
    icon: Crown,
  },
  {
    value: "FAST_CONCISE",
    key: "fastConcise",
    icon: Lightning,
  },
  {
    value: "EMPATHETIC",
    key: "empathetic",
    icon: HeartStraightIcon,
  },
  {
    value: "ENERGETIC",
    key: "energetic",
    icon: Sparkle,
  },
  {
    value: "CALM",
    key: "calm",
    icon: MoonStar,
  },
  {
    value: "CONFIDENT",
    key: "confident",
    icon: ShieldCheck,
  },
  {
    value: "CONVERSATIONAL",
    key: "conversational",
    icon: MessageCircle,
  },
  {
    value: "FORMAL",
    key: "formal",
    icon: ScalesIcon,
  },
  {
    value: "SUPPORTIVE",
    key: "supportive",
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
  const t = useTranslations("dashboard.agents.wizard");
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-display-sm font-display tracking-tight text-ink text-balance">
          {t("toneTitle")}
        </h1>
        <p className="max-w-xl text-body-sm leading-relaxed text-muted">
          {t("toneDescription")}
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TONE_OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            title={t(opt.key)}
            icon={opt.icon}
            selected={!toneIsCustom && tone === opt.value}
            onClick={() => onPickPreset(opt.value)}
          />
        ))}
        <CustomCard
          title={t("custom")}
          icon={PenLineIcon}
          selected={toneIsCustom}
          onSelect={onPickCustom}
        />
      </div>

      {toneIsCustom ? (
        <InlineCustomForm
          id="custom-tone"
          label={t("customTone")}
          placeholder={t("describeTone")}
          helper={t("customToneHint")}
          value={customTone}
          onChange={onCustomToneChange}
          onContinue={onContinueCustom}
        />
      ) : null}
    </div>
  );
}
