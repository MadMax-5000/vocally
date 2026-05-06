import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-dvh flex-1 flex-col bg-surface-card">
        <DashboardTopbar />
        <main className="flex-1 px-6 py-4">{children}</main>
      </div>
    </SidebarProvider>
  )
}
