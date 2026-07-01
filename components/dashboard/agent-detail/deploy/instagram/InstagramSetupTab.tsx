"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { ExternalLink } from "@/lib/icons/app-icons";

type InstagramSetupTabProps = {
  agentId: string;
  instagramEnabled: boolean;
  isPublic: boolean;
  isActive: boolean;
};

export function InstagramSetupTab({
  agentId,
  instagramEnabled,
  isPublic,
  isActive,
}: InstagramSetupTabProps) {
  const blockingIssue = !instagramEnabled
    ? "Enable Instagram to connect and receive messages."
    : !isPublic
      ? "Set agent visibility to Public to serve real customers."
      : !isActive
        ? "Set agent status to Active to reply automatically."
        : null;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Prerequisites</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          Instagram DMs use Meta’s Instagram Messaging API. You’ll need an Instagram
          professional account connected to a Facebook Page, and you must enable
          Connected Tools access in Instagram settings.
        </p>

        <div className="mt-4 space-y-2">
          <div className="flex items-start justify-between gap-3 rounded-lg border border-hairline bg-canvas-soft/60 p-3">
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-ink">Connected Tools</p>
              <p className="mt-0.5 text-caption text-muted">
                Instagram Settings → Messages and story replies → Message controls →
                Connected Tools → Allow Access to Messages
              </p>
            </div>
            <a
              className="btn-outline shrink-0"
              href="https://developers.facebook.com/documentation/business-messaging/instagram-messaging/get-started"
              target="_blank"
              rel="noreferrer"
            >
              Docs <AppIcon icon={ExternalLink} size={14} className="ml-1 inline size-3.5" />
            </a>
          </div>

          {blockingIssue ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-caption text-amber-800">
              {blockingIssue}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Connect Instagram</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          Connect your Facebook Page linked to your Instagram professional account.
          Once connected, incoming DMs can be routed to this agent for replies.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              window.location.href = `/api/integrations/instagram/oauth/start?agentId=${encodeURIComponent(
                agentId,
              )}`;
            }}
            disabled={!instagramEnabled}
          >
            Connect Instagram
          </button>
          <p className="text-caption text-muted">
            You’ll be redirected to Meta to authorize access.
          </p>
        </div>
      </section>
    </div>
  );
}

