"use client";

import { SupportedLanguage } from "@prisma/client";

import { SelectableCard } from "@/components/onboarding/SelectableCard";
import { Button } from "@/components/ui/button";
import { ArabicFlag, DarijaFlag, EnglishFlag, FrenchFlag } from "@/utils/flags";
import { useTranslations } from "next-intl";

const OPTIONS: { value: SupportedLanguage; key: string; customIcon: React.ComponentType<{ className?: string }> }[] = [
  { value: "ARABIC", key: "arabicMsa", customIcon: ArabicFlag },
  { value: "DARIJA", key: "darija", customIcon: DarijaFlag },
  { value: "FRENCH", key: "french", customIcon: FrenchFlag },
  { value: "ENGLISH", key: "english", customIcon: EnglishFlag },
];

type LanguagesStepProps = {
  languages: SupportedLanguage[];
  onToggle: (value: SupportedLanguage) => void;
  onContinue: () => void;
};

export function LanguagesStep({ languages, onToggle, onContinue }: LanguagesStepProps) {
  const t = useTranslations("dashboard.agents.wizard");
  const agents = useTranslations("dashboard.agents");
  const canContinue = languages.length > 0;

  return (
    <div className="flex flex-col gap-6 pt-24">
      <header className="space-y-2">
        <h1 className="text-display-sm font-display tracking-tight text-ink text-balance">
          {t("languagesTitle")}
        </h1>
        <p className="max-w-xl text-body-sm leading-relaxed text-muted">
          {t("languagesDescription")}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            title={opt.key === "arabicMsa" ? t(opt.key) : agents(opt.key)}
            customIcon={opt.customIcon}
            selected={languages.includes(opt.value)}
            onClick={() => onToggle(opt.value)}
          />
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="button" variant="primary" onClick={onContinue} disabled={!canContinue}>
          {t("continue")}
        </Button>
      </div>
    </div>
  );
}
