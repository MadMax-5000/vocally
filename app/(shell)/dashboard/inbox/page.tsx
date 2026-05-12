import { auth } from "@clerk/nextjs/server";
import { getInboxSessions } from "@/lib/actions/sessions";
import { InboxClient } from "@/components/dashboard/inbox/InboxClient";

export default async function InboxPage() {
  const session = await auth();
  if (!session.orgId) {
    return (
      <p className="text-body-sm text-muted">
        Select an organization to view the inbox.
      </p>
    );
  }

  const result = await getInboxSessions();

  const sessions = result.success ? result.data : [];

  return <InboxClient sessions={sessions} />;
}
