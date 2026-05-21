"use client";

import { SupportedLanguage } from "@prisma/client";

import { SelectableCard } from "@/components/onboarding/SelectableCard";
import { Button } from "@/components/ui/button";
import { ArabicFlag, DarijaFlag, EnglishFlag, FrenchFlag } from "@/utils/flags";

const OPTIONS: { value: SupportedLanguage; label: string; icon: React.ElementType }[] = [
  { value: "ARABIC", label: "Arabic (MSA)", icon: ArabicFlag },
  { value: "DARIJA", label: "Darija", icon: DarijaFlag },
  { value: "FRENCH", label: "French", icon: FrenchFlag },
  { value: "ENGLISH", label: "English", icon: EnglishFlag },
];

type LanguagesStepProps = {
  languages: SupportedLanguage[];
  onToggle: (value: SupportedLanguage) => void;
  onContinue: () => void;
};

export function LanguagesStep({ languages, onToggle, onContinue }: LanguagesStepProps) {
  const canContinue = languages.length > 0;

  return (
    <div className="flex flex-col gap-6 pt-24">
      <header className="space-y-2">
        <h1 className="text-display-sm font-display tracking-tight text-ink text-balance">
          Which languages should your agent speak?
        </h1>
        <p className="max-w-xl text-body-sm leading-relaxed text-muted">
          Select every language this agent should handle. You can add more later.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            title={opt.label}
            icon={opt.icon}
            selected={languages.includes(opt.value)}
            onClick={() => onToggle(opt.value)}
          />
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="button" variant="primary" onClick={onContinue} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
