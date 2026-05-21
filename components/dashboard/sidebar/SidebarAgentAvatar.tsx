"use client";

import { AVATAR_DATA, AnimatedAvatar } from "@/utils/lib/avatars";

const SIDEBAR_AVATAR_SIZE = 18;

export function SidebarAgentAvatar({ agentId }: { agentId: string }) {
  const avatar = (() => {
    let hash = 0;
    for (let i = 0; i < agentId.length; i++) {
      hash = (hash * 31 + agentId.charCodeAt(i)) >>> 0;
    }
    return AVATAR_DATA[hash % AVATAR_DATA.length];
  })();

  if (!avatar) {
    return (
      <span
        className="shrink-0 rounded-full bg-surface-strong"
        style={{ width: SIDEBAR_AVATAR_SIZE, height: SIDEBAR_AVATAR_SIZE }}
      />
    );
  }

  return (
    <span
      className="inline-flex shrink-0 overflow-hidden rounded-full ring-1 ring-hairline"
      style={{ width: SIDEBAR_AVATAR_SIZE, height: SIDEBAR_AVATAR_SIZE }}
    >
      <AnimatedAvatar avatar={avatar} size={SIDEBAR_AVATAR_SIZE} />
    </span>
  );
}
