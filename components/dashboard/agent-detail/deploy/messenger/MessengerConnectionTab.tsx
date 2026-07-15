"use client";

import { ZernioConnectButton } from "../zernio/ZernioConnectButton";

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
    <ZernioConnectButton
      agentId={agentId}
      channelType="MESSENGER"
      iconSrc="/svg/messenger.svg"
      channelLabel="Facebook Messenger"
    />
  );
}
