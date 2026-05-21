"use client"

import * as React from "react"
import { useOrganizationList, useOrganization } from "@clerk/nextjs"
import { Check, ChevronsUpDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function OrgSwitcher() {
  const { setExpandHoverLock } = useSidebar()
  const { userMemberships, isLoaded, setActive } = useOrganizationList()
  const { organization: activeOrg } = useOrganization()

  const orgs = userMemberships?.data || []

  const displayOrgs = orgs.length > 0
    ? orgs
    : activeOrg
      ? [{ organization: activeOrg }]
      : []

  if (!isLoaded) {
    return (
      <SidebarMenu className="px-1 py-2">
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <span className="flex flex-col gap-1 leading-none">
              <span className="h-3 w-24 animate-pulse rounded bg-surface-strong" />
              <span className="h-2 w-16 animate-pulse rounded bg-surface-strong" />
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const handleSelect = async (orgId: string) => {
    await setActive({ organization: orgId })
  }

  const currentName = activeOrg?.name || "Personal"
  const currentSlug = activeOrg?.slug || ""

  return (
    <SidebarMenu className="px-1 py-2">
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={setExpandHoverLock}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-surface-strong data-[state-open]:text-ink"
            >
              <span className="truncate text-[13px] font-medium text-ink">
                {currentName}
              </span>
              <span className="ml-auto shrink-0 text-muted group-data-[collapsible=icon]:ml-0">
                <ChevronsUpDown className="size-4" />
              </span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-0"
            align="start"
          >
            {displayOrgs.map(({ organization }) => (
              <DropdownMenuItem
                key={organization.id}
                onSelect={() => handleSelect(organization.id)}
              >
                <span className="truncate">{organization.name}</span>
                {organization.id === activeOrg?.id && (
                  <Check className="ml-auto size-4 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
