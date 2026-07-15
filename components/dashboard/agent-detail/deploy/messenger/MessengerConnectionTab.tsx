"use client";

import { FiwanoChannelStatus } from "../fiwano/FiwanoChannelStatus";

type Props = {
  agentId: string;
  settings: {
    connection: {
      pageId: string;
      pageName: string | null;
      connectedAt: Date;
      webhookVerifyToken: string;
    } | null;
  };
  onSettingsRefresh: () => Promise<void>;
};

export function MessengerConnectionTab({ agentId }: Props) {
  return (
    <FiwanoChannelStatus
      agentId={agentId}
      channelType="MESSENGER"
      iconSrc="/svg/messenger.svg"
      channelLabel="Facebook Messenger"
      fiwanoChannelId="877747f18ed25ca2"
    />
  );
}
