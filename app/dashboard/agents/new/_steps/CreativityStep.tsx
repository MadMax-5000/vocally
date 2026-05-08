"use client";

import { CreativityLevel } from "@prisma/client";
import { Scale, Sparkles, Target } from "lucide-react";

import { SelectableCard } from "@/components/onboarding/SelectableCard";
import { LightbulbIcon, LockKeyIcon, ScalesIcon } from "@phosphor-icons/react";

const LEVELS: {
  value: CreativityLevel;
  label: string;
  Icon: typeof Target;
}[] = [
  {
    value: "STRICT",
    label: "Strict",
    Icon: LockKeyIcon,
  },
  {
    value: "BALANCED",
    label: "Balanced",
    Icon: ScalesIcon,
  },
  {
    value: "CREATIVE",
    label: "Creative",
    Icon: LightbulbIcon ,
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
        <h1 className="text-display-sm font-display font-bold tracking-tight text-ink text-balance">
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
            icon={opt.Icon}
            selected={creativity === opt.value}
            onClick={() => onPick(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}
