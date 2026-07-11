"use client"

import * as React from "react"
import { Link } from "@/i18n/routing"
import { usePathname } from "@/i18n/routing"
import { useTranslations } from "next-intl"

import type { IconSvgElement } from "@/components/ui/app-icon"
import { AppIcon } from "@/components/ui/app-icon"
import { KnowledgeIcon } from "@/components/ui/icons"
import { SidebarAgentsSection } from "@/components/dashboard/sidebar/SidebarAgentsSection"
import {
  BarChart2Icon,
  BriefcaseIcon,
  CreditCard,
  Inbox,
  Radio,
} from "@/lib/icons/app-icons"

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
  useSidebar,
} from "@/components/ui/sidebar"
import { AnselioLogo } from "@/components/brand/AnselioLogo"
import { BRAND_NAME } from "@/lib/constants/brand"
import { cn } from "@/lib/utils"
import { OrgSwitcher } from "./OrgSwitcher"
import { getEscalationCount } from "@/lib/actions/sessions"
import { getSupabaseBrowser } from "@/lib/supabase/client"

type SidebarIcon = IconSvgElement | typeof KnowledgeIcon

function SidebarNavIcon({ icon }: { icon: SidebarIcon }) {
  if (icon === KnowledgeIcon) {
    return <KnowledgeIcon />
  }
  return <AppIcon icon={icon as IconSvgElement} size={16} />
}

const operationsItems: { key: "inbox" | "leads" | "live" | "analytics"; url: string; icon: IconSvgElement }[] = [
  { key: "inbox", url: "/dashboard/inbox", icon: Inbox },
  { key: "leads", url: "/dashboard/leads", icon: BriefcaseIcon },
  { key: "live", url: "/dashboard/live", icon: Radio },
  { key: "analytics", url: "/dashboard/analytics", icon: BarChart2Icon },
]

const workspaceItems: { key: "knowledge" | "billing"; url: string; icon: SidebarIcon }[] = [
  { key: "knowledge", url: "/dashboard/knowledge", icon: KnowledgeIcon },
  { key: "billing", url: "/dashboard/billing", icon: CreditCard },
]

function SidebarBrand() {
  const { state, isMobile, openMobile, expandOnHover } = useSidebar()
  const isExpanded = isMobile ? openMobile : state === "expanded"

  return (
    <SidebarHeader
      className={cn(
        "flex-row items-center pb-4",
        isExpanded
          ? expandOnHover
            ? "justify-start gap-2"
            : "justify-between gap-2"
          : "w-full justify-center px-0",
      )}
    >
      <Link
        href="/dashboard/agents"
        aria-label={BRAND_NAME}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-md transition-opacity hover:opacity-80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-soft",
          !isExpanded && "justify-center",
        )}
      >
        <AnselioLogo variant="black" size="sm" />
        {isExpanded ? (
          <span className="font-display text-title-md tracking-tight text-ink whitespace-nowrap">
            {BRAND_NAME}
          </span>
        ) : null}
      </Link>
      {!expandOnHover && isExpanded ? <SidebarTrigger /> : null}
    </SidebarHeader>
  )
}

export function AppSidebar() {
  const t = useTranslations("dashboard.nav")
  const pathname = usePathname()
  const { state, isMobile, openMobile } = useSidebar()
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
    <Sidebar collapsible="overlay">
      <SidebarBrand />
      <SidebarContent>
        <SidebarAgentsSection />

        <SidebarGroup>
          <SidebarGroupLabel>{t("operations")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.key)}
                  >
                    <Link href={item.url} className="relative">
                      <SidebarNavIcon icon={item.icon} />
                      <span>{t(item.key)}</span>
                      {item.key === "inbox" &&
                        escalationCount > 0 &&
                        (isMobile ? openMobile : state === "expanded") && (
                        <span
                          data-sidebar="menu-trailing"
                          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white"
                        >
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
          <SidebarGroupLabel>{t("workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.key)}
                  >
                    <Link href={item.url}>
                      <SidebarNavIcon icon={item.icon} />
                      <span>{t(item.key)}</span>
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
