"use client";

import { WORDPRESS_PLUGIN_DOWNLOAD_PATH } from "./WordPressSetupTab";

const STEPS = [
  {
    title: "Download the plugin",
    body: (
      <>
        Download{" "}
        <a
          href={WORDPRESS_PLUGIN_DOWNLOAD_PATH}
          download
          className="font-medium text-primary hover:underline"
        >
          vocally-wordpress.zip
        </a>{" "}
        from the Setup tab.
      </>
    ),
  },
  {
    title: "Install in WordPress",
    body: (
      <>
        In wp-admin go to <strong>Plugins → Add New → Upload Plugin</strong>, choose the zip,
        then <strong>Activate</strong>.
      </>
    ),
  },
  {
    title: "Configure credentials",
    body: (
      <>
        Open <strong>Settings → Vocally</strong>. Paste your Vocally App URL, Agent ID, and
        widget token (if shown on Setup). Choose <strong>Floating</strong> for a site-wide
        bubble or <strong>Shortcode only</strong> to place chat with{" "}
        <code className="rounded bg-surface-strong px-1 py-0.5 font-mono text-caption">
          [vocally_agent]
        </code>
        .
      </>
    ),
  },
  {
    title: "Save and preview",
    body: "Visit your site’s front end (not the admin). You should see the chat bubble or shortcode embed.",
  },
] as const;

export function WordPressInstallTab() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-body-sm text-muted">
          Follow these steps to connect WordPress using the official Vocally plugin. For manual
          embed without the plugin, use the Embed code tab.
        </p>
      </div>

      <ol className="space-y-5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-caption font-semibold text-canvas">
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <h4 className="text-body-sm font-medium text-ink">{step.title}</h4>
              <p className="mt-1 text-body-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
        <h4 className="text-body-sm font-medium text-ink">Without the plugin</h4>
        <p className="mt-2 text-body-sm text-muted">
          Install{" "}
          <a
            href="https://wordpress.org/plugins/insert-headers-and-footers/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            WPCode
          </a>{" "}
          (or similar), paste the floating snippet from the Embed code tab into the footer, or
          use a Custom HTML block for inline iframe embeds.
        </p>
        <p className="mt-2 text-caption text-muted">
          See <code className="rounded bg-surface-strong px-1 py-0.5 font-mono text-caption">docs/wordpress-deploy.md</code>{" "}
          in the Vocally repository for troubleshooting.
        </p>
      </div>
    </div>
  );
}
