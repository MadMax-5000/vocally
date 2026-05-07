"use client"

import * as React from "react"
import { useOrganizationList, useOrganization } from "@clerk/nextjs"
import { Check, ChevronsUpDown, Building2 } from "lucide-react"

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
} from "@/components/ui/sidebar"

export function OrgSwitcher() {
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
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-surface-strong">
              <Building2 className="size-5 text-muted" />
            </div>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-surface-strong data-[state-open]:text-ink"
            >
              <div className="flex aspect-square size-9 items-center justify-center rounded-lg">
                {activeOrg?.imageUrl ? (
                  <img
                    src={activeOrg.imageUrl}
                    alt={activeOrg.name || "Organization"}
                    className="size-5 rounded-sm"
                  />
                ) : (
                  <Building2 className="size-5 text-muted" />
                )}
              </div>
              <span className="flex min-w-0 flex-col gap-1 leading-none">
                <span className="truncate text-[13px] font-medium text-ink">
                  {currentName}
                </span>
                {currentSlug && (
                  <span className="truncate text-[11px] text-muted">
                    {currentSlug}
                  </span>
                )}
              </span>
              <span className="ml-auto shrink-0 text-muted">
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
                {organization.imageUrl && (
                  <img
                    src={organization.imageUrl}
                    alt={organization.name || "Organization"}
                    className="mr-2 size-4 rounded-sm"
                  />
                )}
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
