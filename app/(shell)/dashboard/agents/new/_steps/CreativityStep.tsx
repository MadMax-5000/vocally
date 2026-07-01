"use client";

import type { IconSvgElement } from "@/components/ui/app-icon";
import { CreativityLevel } from "@prisma/client";
import { Lightbulb, LockIcon, ScalesIcon } from "@/lib/icons/app-icons";

import { SelectableCard } from "@/components/onboarding/SelectableCard";

const LEVELS: {
  value: CreativityLevel;
  label: string;
  icon: IconSvgElement;
}[] = [
  {
    value: "STRICT",
    label: "Strict",
    icon: LockIcon,
  },
  {
    value: "BALANCED",
    label: "Balanced",
    icon: ScalesIcon,
  },
  {
    value: "CREATIVE",
    label: "Creative",
    icon: Lightbulb,
  },
];

type CreativityStepProps = {
  creativity: CreativityLevel | null;
  onPick: (value: CreativityLevel) => void;
};

export function CreativityStep({ creativity, onPick }: CreativityStepProps) {
  return (
    <div className="flex flex-col gap-6 pt-36">
      <header className="space-y-2">
        <h1 className="text-display-sm font-display tracking-tight text-ink text-balance">
          How creative should responses be?
        </h1>
        <p className="max-w-xl text-body-sm leading-relaxed text-muted">
          This controls how tightly the model hews to known facts versus paraphrasing.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LEVELS.map((opt) => (
          <SelectableCard
            key={opt.value}
            title={opt.label}
            icon={opt.icon}
            selected={creativity === opt.value}
            onClick={() => onPick(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}
