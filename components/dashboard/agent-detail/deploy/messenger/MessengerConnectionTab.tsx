"use client";

import { ZernioOAuthButton } from "../zernio/ZernioOAuthButton";

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
    <ZernioOAuthButton
      agentId={agentId}
      platform="facebook"
      iconSrc="/svg/messenger.svg"
      channelLabel="Facebook Messenger"
    />
  );
}
