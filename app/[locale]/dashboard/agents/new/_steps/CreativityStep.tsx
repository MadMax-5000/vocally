"use client";

import type { IconSvgElement } from "@/components/ui/app-icon";
import { CreativityLevel } from "@prisma/client";
import { Lightbulb, LockIcon, ScalesIcon } from "@/lib/icons/app-icons";

import { SelectableCard } from "@/components/onboarding/SelectableCard";
import { useTranslations } from "next-intl";

const LEVELS: { value: CreativityLevel; key: string; icon: IconSvgElement }[] = [
  {
    value: "STRICT",
    key: "strict",
    icon: LockIcon,
  },
  {
    value: "BALANCED",
    key: "balanced",
    icon: ScalesIcon,
  },
  {
    value: "CREATIVE",
    key: "creative",
    icon: Lightbulb,
  },
];

type CreativityStepProps = {
  creativity: CreativityLevel | null;
  onPick: (value: CreativityLevel) => void;
};

export function CreativityStep({ creativity, onPick }: CreativityStepProps) {
  const t = useTranslations("dashboard.agents.wizard");
  return (
    <div className="flex flex-col gap-6 pt-36">
      <header className="space-y-2">
        <h1 className="text-display-sm font-display tracking-tight text-ink text-balance">
          {t("creativityTitle")}
        </h1>
        <p className="max-w-xl text-body-sm leading-relaxed text-muted">
          {t("creativityDescription")}
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LEVELS.map((opt) => (
          <SelectableCard
            key={opt.value}
            title={t(opt.key)}
            icon={opt.icon}
            selected={creativity === opt.value}
            onClick={() => onPick(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}
