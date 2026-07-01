"use client"

import * as React from "react"
import Link from "next/link"

import { AppIcon } from "@/components/ui/app-icon"
import { KnowledgeIcon } from "@/components/ui/icons"
import { Bell, MessageCircle } from "@/lib/icons/app-icons"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UserAvatarMenu } from "./UserAvatarMenu"

export function DashboardTopbar() {
  return (
    <header className="sticky top-0 z-40 flex h-12 w-full shrink-0 items-center border-b border-hairline bg-surface-card px-3">
      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Feedback"
              className="text-muted hover:text-ink"
            >
              <AppIcon icon={MessageCircle} size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Feedback</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              asChild
              aria-label="Documentation"
              className="text-muted hover:text-ink"
            >
              <Link href="/docs">
                <KnowledgeIcon className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Docs</TooltipContent>
        </Tooltip>

        {/* Separator */}
        <div className="mx-1 h-5 w-px bg-hairline" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Notifications"
              className="relative text-muted hover:text-ink"
            >
              <AppIcon icon={Bell} size={16} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-semantic-error" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        <UserAvatarMenu />
      </div>
    </header>
  )
}
