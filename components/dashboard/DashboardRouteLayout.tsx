"use client";

import { usePathname } from "@/i18n/routing";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { ProductAssistantWidget } from "@/components/dashboard/ProductAssistantWidget";

/**
 * Fullscreen routes under /dashboard (no sidebar/topbar) must be listed here.
 * All dashboard routes live under `app/[locale]/dashboard/` and share this layout.
 */
const FULLSCREEN_DASHBOARD_PATHS = new Set<string>(["/dashboard/agents/new"]);

function isAgentDetailRoute(pathname: string): boolean {
  // Matches /dashboard/agents/:agentId (single segment), not list/new/templates
  const m = pathname.match(/^\/dashboard\/agents\/([^/]+)$/);
  if (!m) return false;
  const id = m[1];
  return id !== "new" && id !== "templates";
}

export function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullscreen = pathname ? FULLSCREEN_DASHBOARD_PATHS.has(pathname) : false;
  const hideDashboardTopbar = pathname ? isAgentDetailRoute(pathname) : false;

  if (isFullscreen) {
    return (
      <div className="min-h-dvh bg-surface-card">
        {children}
        <ProductAssistantWidget />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false} persistCookie={false}>
      <AppSidebar />
      <div className="flex min-h-dvh flex-1 flex-col bg-surface-card">
        {hideDashboardTopbar ? null : <DashboardTopbar />}
        <main className={hideDashboardTopbar ? "flex-1 px-4 py-0" : "flex-1 px-4 py-3"}>
          {children}
        </main>
      </div>
      <ProductAssistantWidget />
    </SidebarProvider>
  );
}
