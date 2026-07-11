"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

type DeployComingSoonPanelProps = {
  title: string;
  description?: string;
  iconSrc?: string;
};

export function DeployComingSoonPanel({
  title,
  description,
  iconSrc,
}: DeployComingSoonPanelProps) {
  const t = useTranslations("dashboard.deploy");
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-hairline-strong bg-surface-strong/80 px-6 py-16 text-center">
      {iconSrc ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-xl border border-hairline bg-canvas-soft">
          <Image
            src={iconSrc}
            alt=""
            width={32}
            height={32}
            className="size-8 object-contain opacity-40 grayscale"
          />
        </div>
      ) : null}

      <span className="mb-3 rounded-pill bg-canvas-soft px-2.5 py-0.5 text-caption-uppercase text-muted-soft">
        {t("common.comingSoon")}
      </span>

      <h3 className="font-display text-display-sm font-normal tracking-tight text-muted">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-body-sm leading-relaxed text-muted-soft">
        {description ??
          t("comingSoonPanel.description", { title })}
      </p>
    </div>
  );
}
