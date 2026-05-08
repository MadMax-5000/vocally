"use client";

import { AgentChannelType } from "@prisma/client";

import { SelectableCard } from "@/components/onboarding/SelectableCard";
import { Button } from "@/components/ui/button";
import { CHANNEL_META } from "@/lib/constants/agent-channels";

type ChannelsStepProps = {
  channels: AgentChannelType[];
  onToggle: (value: AgentChannelType) => void;
  onContinue: () => void;
};

export function ChannelsStep({ channels, onToggle, onContinue }: ChannelsStepProps) {
  const canContinue = channels.length > 0;

  return (
    <div className="flex flex-col gap-6 pt-[60px]">
      <header className="space-y-2">
        <h1 className="text-display-sm font-display font-bold tracking-tight text-ink text-balance">
          Where will this agent work?
        </h1>
        <p className="max-w-xl text-body-sm leading-relaxed text-muted">
          Choose every channel you plan to connect. You can configure credentials later.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CHANNEL_META.map((opt) => (
          <SelectableCard
            key={opt.value}
            title={opt.label}
            iconSrc={opt.iconSrc}
            selected={channels.includes(opt.value)}
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
