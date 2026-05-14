"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Inbox,
  Radio,
  CreditCard,
} from "lucide-react"
import { AgentIcon, KnowledgeIcon } from "@/components/ui/icons"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { OrgSwitcher } from "./OrgSwitcher"
import { getEscalationCount } from "@/lib/actions/sessions"
import { getSupabaseBrowser } from "@/lib/supabase/client"

const operationsItems = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Inbox", url: "/dashboard/inbox", icon: Inbox },
  { title: "Live monitor", url: "/dashboard/live", icon: Radio },
]

const workspaceItems = [
  { title: "Agents", url: "/dashboard/agents", icon: AgentIcon },
  { title: "Knowledge base", url: "/dashboard/knowledge", icon: KnowledgeIcon },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [escalationCount, setEscalationCount] = React.useState(0)

  React.useEffect(() => {
    getEscalationCount().then((res) => {
      if (res.success) setEscalationCount(res.data)
    })

    const supabase = getSupabaseBrowser()
    if (!supabase) return

    const channel = supabase
      .channel("sidebar-escalations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Session",
          filter: `status=eq.ESCALATED`,
        },
        () => {
          getEscalationCount().then((res) => {
            if (res.success) setEscalationCount(res.data)
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="items-end pb-4">
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} className="relative">
                      <item.icon />
                      <span>{item.title}</span>
                      {item.title === "Inbox" && escalationCount > 0 && (
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {escalationCount > 99 ? "99+" : escalationCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/dashboard/agents"
                        ? pathname === item.url ||
                          pathname.startsWith(`${item.url}/`)
                        : pathname === item.url
                    }
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <OrgSwitcher />
      </SidebarFooter>
    </Sidebar>
  )
}
