"use client";

type InstagramTestTabProps = { agentId: string };

export function InstagramTestTab({ agentId }: InstagramTestTabProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">Test messaging</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          After connecting, send a DM to your Instagram professional account from a
          personal account. If the webhook is configured correctly, the agent will
          reply automatically.
        </p>

        <div className="mt-4 rounded-lg border border-hairline bg-canvas-soft/60 p-3">
          <p className="text-caption text-muted">
            Agent: <span className="font-medium text-ink">{agentId}</span>
          </p>
          <p className="mt-1 text-caption text-muted">
            Tip: if you don’t see replies, confirm the Meta webhook callback URL and
            verify token are set, and that Connected Tools access is enabled.
          </p>
        </div>
      </section>
    </div>
  );
}

