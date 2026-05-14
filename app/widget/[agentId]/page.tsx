"use client";

import { useSearchParams } from "next/navigation";
import { ChatWidget } from "@/components/chat/ChatWidget";

export default function WidgetPage({ params }: { params: { agentId: string } }) {
  const searchParams = useSearchParams();

  return (
    <div className="h-dvh w-full overflow-hidden bg-transparent">
      <ChatWidget
        agentId={params.agentId}
        agentName={searchParams.get("title") ?? "AI Assistant"}
        welcomeMessage={searchParams.get("welcome") ?? "Hello! How can I help you today?"}
        className="h-full w-full rounded-none border-0"
      />
    </div>
  );
}
