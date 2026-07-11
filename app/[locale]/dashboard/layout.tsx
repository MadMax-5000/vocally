import { DashboardRouteLayout } from "@/components/dashboard/DashboardRouteLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardRouteLayout>{children}</DashboardRouteLayout>;
}
