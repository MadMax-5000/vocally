"use client";

import { AVATAR_DATA, AnimatedAvatar } from "@/utils/lib/avatars";
import type { AgentTemplate } from "@/lib/templates/agent-templates";
import {
  AgentCardMetaFooter,
  CARD_AVATAR_SIZE,
  humanizeEnum,
} from "@/components/dashboard/agent-card-shared";

type TemplateStackedCardProps = {
  template: AgentTemplate;
  index: number;
  onSelect: (id: string) => void;
};

function TemplateAvatar({ avatarId }: { avatarId: string }) {
  const avatar = AVATAR_DATA.find((a) => a.id === avatarId);
  if (!avatar) {
    return (
      <div
        className="shrink-0 rounded-full bg-surface-strong"
        style={{ width: CARD_AVATAR_SIZE, height: CARD_AVATAR_SIZE }}
        aria-hidden
      />
    );
  }
  return <AnimatedAvatar avatar={avatar} size={CARD_AVATAR_SIZE} />;
}

export function TemplateStackedCard({
  template,
  index,
  onSelect,
}: TemplateStackedCardProps) {
  const { defaults } = template;
  const displayType = humanizeEnum(defaults.agentType);
  const displayTone = humanizeEnum(defaults.tone);

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className="group flex w-full flex-col rounded-xl border border-hairline bg-surface-card p-4 text-left transition-all duration-200 hover:border-hairline-strong/70 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="relative shrink-0"
          style={{ width: CARD_AVATAR_SIZE, height: CARD_AVATAR_SIZE }}
        >
          <TemplateAvatar avatarId={template.avatarId} />
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <h3 className="truncate font-display text-title-sm tracking-tight text-ink transition-colors group-hover:text-ink/90">
            {template.title}
          </h3>
          <p className="mt-0.5 truncate text-body-sm text-muted">
            {displayType} · {displayTone}
          </p>
        </div>
      </div>

      <AgentCardMetaFooter
        channelTypes={defaults.channels}
        languages={defaults.languages}
        stopPropagation
      />
    </button>
  );
}
