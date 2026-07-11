"use client";

import { DeployComingSoonPanel } from "@/components/dashboard/agent-detail/deploy/DeployComingSoonPanel";
import { DeployManageShell } from "@/components/dashboard/agent-detail/deploy/DeployManageShell";
import type { DeployCatalogEntry } from "@/lib/constants/deploy-catalog";
import { useTranslations } from "next-intl";

type DeployStubManageProps = {
  agentId: string;
  entry: Pick<DeployCatalogEntry, "title" | "description" | "iconSrc">;
};

export function DeployStubManage({ agentId, entry }: DeployStubManageProps) {
  const t = useTranslations("dashboard.deploy");
  return (
    <DeployManageShell
      agentId={agentId}
      title={entry.title}
      description={t("comingSoonPanel.roadmap")}
    >
      <DeployComingSoonPanel
        title={entry.title}
        description={entry.description}
        iconSrc={entry.iconSrc}
      />
    </DeployManageShell>
  );
}
