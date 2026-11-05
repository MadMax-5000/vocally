import { HostawayDeployPage } from "@/components/dashboard/agent-detail/deploy/HostawayDeployPage";

export default async function DeployBookingPage({
  params,
}: {
  params: { agentId: string };
}) {
  return <HostawayDeployPage agentId={params.agentId} channel="booking-com" />;
}
