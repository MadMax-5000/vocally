import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function EmailInboundPage() {
  const session = await auth();
  if (session.orgId) {
    redirect("/dashboard/agents");
  }
  
  return (
    <p className="text-body-sm text-muted">
      Select an organization first.
    </p>
  );
}
