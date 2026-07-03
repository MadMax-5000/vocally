import { getOrgKnowledgeDocs } from "@/lib/actions/agents";

import { NewAgentWizard } from "./NewAgentWizard";

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const params = await searchParams;
  const result = await getOrgKnowledgeDocs();
  const knowledgeDocs = result.success ? result.data : [];

  return (
    <NewAgentWizard
      knowledgeDocs={knowledgeDocs}
      templateId={params.template ?? null}
    />
  );
}
