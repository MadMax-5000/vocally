"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DeployFeaturedCard } from "@/components/dashboard/agent-detail/deploy/DeployFeaturedCard";
import {
  ChatWidgetHeroPreview,
  HelpPageHeroPreview,
} from "@/components/dashboard/agent-detail/deploy/DeployHeroMockups";
import { DeployIntegrationCard } from "@/components/dashboard/agent-detail/deploy/DeployIntegrationCard";
import {
  FEATURED_DEPLOYMENTS,
  INTEGRATION_DEPLOYMENTS,
} from "@/lib/constants/deploy-catalog";
import {
  isHelpPageEnabled,
  isIntegrationDeploymentEnabled,
  isWebChatEnabled,
} from "@/lib/deploy/web-chat-config";
import { updateAgentDeployment } from "@/lib/actions/agents";

import type { AgentDetailWithRelations } from "./agent-detail-types";

type Props = { agent: AgentDetailWithRelations };

function buildIntegrationState(
  channels: AgentDetailWithRelations["channels"],
): Record<string, boolean> {
  return Object.fromEntries(
    INTEGRATION_DEPLOYMENTS.map((entry) => [
      entry.id,
      isIntegrationDeploymentEnabled(channels, entry),
    ]),
  );
}

export function AgentDetailDeployTab({ agent }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [webChatEnabled, setWebChatEnabled] = useState(() =>
    isWebChatEnabled(agent.channels),
  );
  const [helpPageEnabled, setHelpPageEnabled] = useState(() =>
    isHelpPageEnabled(agent.channels),
  );
  const [integrationEnabled, setIntegrationEnabled] = useState(() =>
    buildIntegrationState(agent.channels),
  );

  useEffect(() => {
    setWebChatEnabled(isWebChatEnabled(agent.channels));
    setHelpPageEnabled(isHelpPageEnabled(agent.channels));
    setIntegrationEnabled(buildIntegrationState(agent.channels));
  }, [agent.channels]);

  function handleFeaturedToggle(
    kind: "webChat" | "helpPage",
    enabled: boolean,
    rollback: () => void,
  ) {
    startTransition(async () => {
      const result = await updateAgentDeployment(agent.id, {
        ...(kind === "webChat" ? { webChatEnabled: enabled } : {}),
        ...(kind === "helpPage" ? { helpPageEnabled: enabled } : {}),
      });
      if (!result.success) {
        rollback();
        toast.error(result.error ?? "Failed to update");
        return;
      }
      router.refresh();
    });
  }

  function handleIntegrationToggle(id: string, enabled: boolean) {
    const previous = integrationEnabled[id];
    setIntegrationEnabled((prev) => ({ ...prev, [id]: enabled }));

    startTransition(async () => {
      const result = await updateAgentDeployment(agent.id, {
        integrationId: id,
        integrationEnabled: enabled,
      });
      if (!result.success) {
        setIntegrationEnabled((prev) => ({ ...prev, [id]: previous }));
        toast.error(result.error ?? "Failed to update");
        return;
      }
      router.refresh();
    });
  }

  const manageBase = `/dashboard/agents/${agent.id}/deploy`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 py-2">
      <div>
        <h2 className="font-display text-display-sm font-normal tracking-tight text-ink">
          All channels
        </h2>
        <p className="mt-0.5 text-body-sm text-muted">
          Deploy your agent across web, messaging, and integrations.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {FEATURED_DEPLOYMENTS.map((item) => {
          const isChat = item.id === "chat-widget";
          const enabled = isChat ? webChatEnabled : helpPageEnabled;

          return (
            <DeployFeaturedCard
              key={item.id}
              title={item.title}
              description={item.description}
              heroBackground={item.heroBackground}
              heroPreview={
                isChat ? <ChatWidgetHeroPreview /> : <HelpPageHeroPreview />
              }
              enabled={enabled}
              toggling={pending}
              manageHref={`${manageBase}/${item.id}`}
              onEnabledChange={(next) => {
                if (isChat) {
                  setWebChatEnabled(next);
                  handleFeaturedToggle("webChat", next, () =>
                    setWebChatEnabled(!next),
                  );
                } else {
                  setHelpPageEnabled(next);
                  handleFeaturedToggle("helpPage", next, () =>
                    setHelpPageEnabled(!next),
                  );
                }
              }}
            />
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATION_DEPLOYMENTS.map((item) => (
          <DeployIntegrationCard
            key={item.id}
            title={item.title}
            description={item.description}
            iconSrc={item.iconSrc}
            beta={item.beta}
            enabled={integrationEnabled[item.id] ?? false}
            toggling={pending}
            manageHref={`${manageBase}/${item.id}`}
            onEnabledChange={(next) => handleIntegrationToggle(item.id, next)}
          />
        ))}
      </div>
    </div>
  );
}
