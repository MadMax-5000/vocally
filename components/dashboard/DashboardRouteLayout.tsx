"use client";

import { usePathname } from "next/navigation";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

/**
 * Fullscreen routes under /dashboard (no sidebar/topbar) must be listed here.
 * Next merges `app/(shell)/dashboard/*` with `app/dashboard/*` — both share this layout.
 */
const FULLSCREEN_DASHBOARD_PATHS = new Set<string>(["/dashboard/agents/new"]);

export function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullscreen = pathname ? FULLSCREEN_DASHBOARD_PATHS.has(pathname) : false;

  if (isFullscreen) {
    return <div className="min-h-dvh bg-surface-card">{children}</div>;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <div className="flex min-h-dvh flex-1 flex-col bg-surface-card">
        <DashboardTopbar />
        <main className="flex-1 px-4 py-3">{children}</main>
      </div>
    </SidebarProvider>
  );
}
