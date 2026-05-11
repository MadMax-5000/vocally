import { auth } from "@clerk/nextjs/server";

import { KnowledgeBaseClient } from "@/components/dashboard/knowledge/KnowledgeBaseClient";
import { getKnowledgeDashboardData } from "@/lib/actions/knowledge";

export default async function KnowledgePage() {
  const session = await auth();
  const orgId = session.orgId;

  if (!orgId) {
    return (
      <p className="text-body-sm text-muted">
        Select an organization to manage your knowledge base.
      </p>
    );
  }

  const result = await getKnowledgeDashboardData();

  if (!result.success) {
    return (
      <p className="text-body-sm text-muted">
        {result.error ?? "Could not load knowledge base."}
      </p>
    );
  }

  return <KnowledgeBaseClient initial={result.data} />;
}
