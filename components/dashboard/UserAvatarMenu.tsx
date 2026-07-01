"use client"
import { AppIcon } from "@/components/ui/app-icon"
import { UserIcon, SettingsIcon, Command, Sun, LogOutIcon } from "@/lib/icons/app-icons"

import * as React from "react"
import { useUser, SignOutButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function UserAvatarMenu() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div className="h-7 w-7 animate-pulse rounded-full bg-surface-strong" />
  }

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.firstName
    ? user.firstName[0]
    : "U"

  return (
    <>
      <SignedIn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-7 w-7 items-center justify-center rounded-full outline-none ring-offset-canvas transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-hairline-strong">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User avatar"} />
                <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal normal-case tracking-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-[13px] font-medium leading-none text-muted">
                  {user?.fullName}
                </p>
                <p className="text-[11px] leading-none text-muted/80">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <AppIcon icon={UserIcon} className="mr-2 h-4 w-4" />
                <span>Profile</span>
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <AppIcon icon={SettingsIcon} className="mr-2 h-4 w-4" />
                <span>Account settings</span>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <AppIcon icon={Command} className="mr-2 h-4 w-4" />
                <span>Keyboard shortcuts</span>
                <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <AppIcon icon={Sun} className="mr-2 h-4 w-4" />
              <span>Light Theme</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <SignOutButton redirectUrl="/">
              <DropdownMenuItem className="text-semantic-error focus:text-semantic-error [&>svg]:text-semantic-error">
                <AppIcon icon={LogOutIcon} className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </SignOutButton>
          </DropdownMenuContent>
        </DropdownMenu>
      </SignedIn>
      <SignedOut>
        <SignInButton>
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  )
}
