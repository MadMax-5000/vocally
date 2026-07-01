"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { AppIcon } from "@/components/ui/app-icon"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "@/lib/icons/app-icons"
import { buttonVariants } from "@/components/ui/button"

type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={{
        months: "flex flex-col",
        month: "flex flex-col",
        month_caption: "flex items-center justify-center h-8",
        caption_label: "text-sm font-medium text-ink",
        nav: "flex items-center justify-between px-3 pt-2 pb-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 text-muted hover:text-ink",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 text-muted hover:text-ink",
        ),
        month_grid: "border-collapse px-3 pb-3",
        weekdays: "flex",
        weekday: "w-9 text-center text-xs font-medium text-muted pb-1",
        week: "flex",
        day: "p-0",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 text-sm font-normal rounded-md text-ink",
        ),
        selected:
          "bg-primary text-on-primary hover:bg-primary hover:text-on-primary focus:bg-primary focus:text-on-primary rounded-md",
        today: "bg-surface-strong text-ink rounded-md",
        outside: "text-muted-soft",
        disabled: "text-muted-soft opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <AppIcon icon={ChevronLeft} size={16} />
          ) : (
            <AppIcon icon={ChevronRight} size={16} />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
