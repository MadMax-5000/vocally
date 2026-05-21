"use client";

import { useSearchParams } from "next/navigation";

import { HelpCenterChat } from "@/components/chat/HelpCenterChat";

export default function HelpPage({ params }: { params: { agentId: string } }) {
  const searchParams = useSearchParams();

  return (
    <HelpCenterChat
      agentId={params.agentId}
      widgetToken={searchParams.get("token") ?? undefined}
      agentName={searchParams.get("title") ?? "AI Assistant"}
      welcomeMessage={
        searchParams.get("welcome") ?? "Hello! How can I help you today?"
      }
    />
  );
}
