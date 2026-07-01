"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function AgentPublishButton() {
  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      className="shrink-0"
      onClick={() => {
        toast.message("Publish", { description: "Coming soon." });
      }}
    >
      Publish
    </Button>
  );
}
