import { auth } from "@clerk/nextjs/server";
import { getLiveSessions } from "@/lib/actions/sessions";
import { LiveMonitorClient } from "@/components/dashboard/live/LiveMonitorClient";

export default async function LiveMonitorPage() {
  const session = await auth();
  if (!session.orgId) {
    return (
      <p className="text-body-sm text-muted">
        Select an organization to view the live monitor.
      </p>
    );
  }

  const result = await getLiveSessions();
  const sessions = result.success ? result.data : [];

  return <LiveMonitorClient initialSessions={sessions} />;
}
