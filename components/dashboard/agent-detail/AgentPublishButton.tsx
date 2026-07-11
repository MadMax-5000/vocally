"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function AgentPublishButton() {
  const t = useTranslations("dashboard.agentDetail");
  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      className="shrink-0"
      onClick={() => {
        toast.message(t("publish"), { description: t("comingSoon") });
      }}
    >
      {t("publish")}
    </Button>
  );
}
