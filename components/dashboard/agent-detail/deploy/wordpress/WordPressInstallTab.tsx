"use client";

import { WORDPRESS_PLUGIN_DOWNLOAD_PATH } from "./WordPressSetupTab";
import { useDeploySitesMessages } from "../useDeploySitesMessages";

export function WordPressInstallTab() {
  const t = useDeploySitesMessages().wordpress.install;
  const steps = [
    {
      title: t.downloadTitle,
      body: <>{t.downloadBefore} <a href={WORDPRESS_PLUGIN_DOWNLOAD_PATH} download className="font-medium text-primary hover:underline">anselio-wordpress.zip</a> {t.downloadAfter}</>,
    },
    {
      title: t.wordpressTitle,
      body: <>{t.wordpressBodyBefore} <strong>{t.uploadPlugin}</strong>{t.wordpressBodyAfter} <strong>{t.activate}</strong>.</>,
    },
    {
      title: t.configureTitle,
      body: <>{t.configureBefore} <strong>{t.settingsAnselio}</strong>{t.configureAfter} <strong>{t.floating}</strong> {t.configureMiddle} <strong>{t.shortcodeOnly}</strong> {t.configureEnd} <code className="rounded bg-surface-strong px-1 py-0.5 font-mono text-caption">[anselio_agent]</code>.</>,
    },
    { title: t.saveTitle, body: t.saveBody },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-body-sm text-muted">
          {t.intro}
        </p>
      </div>

      <ol className="space-y-5">
        {steps.map((step, index) => (
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
        <h4 className="text-body-sm font-medium text-ink">{t.withoutPlugin}</h4>
        <p className="mt-2 text-body-sm text-muted">
          {t.withoutPluginBefore}{" "}
          <a
            href="https://wordpress.org/plugins/insert-headers-and-footers/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            WPCode
          </a>{" "}
          {t.withoutPluginAfter}
        </p>
        <p className="mt-2 text-caption text-muted">
          {t.troubleshootingBefore} <code className="rounded bg-surface-strong px-1 py-0.5 font-mono text-caption">docs/wordpress-deploy.md</code>{" "}
          {t.troubleshootingAfter}
        </p>
      </div>
    </div>
  );
}
