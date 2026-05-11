"use client"

import * as React from "react"
import Link from "next/link"
import { MessageCircle, BookOpen, Bell } from "lucide-react"

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
      {/* Left: wordmark */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
        >
          <span className="font-display text-[14px] font-normal tracking-tight text-muted">
            Vocally
          </span>
        </Link>
      </div>

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
              <MessageCircle className="h-4 w-4" />
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
                <BookOpen className="h-4 w-4" />
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
              <Bell className="h-4 w-4" />
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
