import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { getHostawaySettings } from "@/lib/actions/hostaway";
import { HOSTAWAY_SUPPORTED_CHANNELS } from "@/lib/hostaway/channels";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

import {
  DeployHostawayManage,
  type HostawayDeployChannel,
} from "./DeployHostawayManage";

type Props = {
  agentId: string;
  channel: HostawayDeployChannel;
};

export async function HostawayDeployPage({ agentId, channel }: Props) {
  const t = await getTranslations("dashboard.agents");
  const agent = await loadDeployAgent(agentId);
  const settingsResult = await getHostawaySettings(agentId);

  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 text-body-sm text-muted">
          {t("loadingAgent")}
        </div>
      }
    >
      <DeployHostawayManage
        agent={agent}
        channel={channel}
        initialSettings={
          settingsResult.success
            ? settingsResult.data
            : {
                connection: null,
                supportedChannels: HOSTAWAY_SUPPORTED_CHANNELS.map(
                  (item) => ({ id: item.id, label: item.label }),
                ),
              }
        }
      />
    </Suspense>
  );
}
