"use client";

import { ZernioOAuthButton } from "../zernio/ZernioOAuthButton";

type InstagramSetupTabProps = {
  agentId: string;
  instagramEnabled: boolean;
  isPublic: boolean;
  isActive: boolean;
};

export function InstagramSetupTab({
  agentId,
  instagramEnabled,
}: InstagramSetupTabProps) {
  if (!instagramEnabled) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-caption text-amber-800">
        Enable Instagram in the header above to connect.
      </div>
    );
  }

  return (
    <ZernioOAuthButton
      agentId={agentId}
      platform="instagram"
      iconSrc="/svg/instagram-icon.svg"
      channelLabel="Instagram DM"
    />
  );
}
