import { getOrgKnowledgeDocs } from "@/lib/actions/agents";

import { NewAgentWizard } from "./NewAgentWizard";

export default async function NewAgentPage() {
  const result = await getOrgKnowledgeDocs();
  const knowledgeDocs = result.success ? result.data : [];

  return <NewAgentWizard knowledgeDocs={knowledgeDocs} />;
}
