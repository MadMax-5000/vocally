import type { Metadata } from "next";

import { DashboardRouteLayout } from "@/components/dashboard/DashboardRouteLayout";
import { DeferredProductAssistantWidget } from "@/components/dashboard/DeferredProductAssistantWidget";
import { noIndexMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = noIndexMetadata;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardRouteLayout>{children}</DashboardRouteLayout>
      <DeferredProductAssistantWidget />
    </>
  );
}
