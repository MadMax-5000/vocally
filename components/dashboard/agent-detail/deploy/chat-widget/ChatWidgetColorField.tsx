"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { RotateCcw } from "@/lib/icons/app-icons"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChatWidgetColorFieldProps = {
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
  className?: string;
};

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`;
  return null;
}

export function ChatWidgetColorField({
  value,
  defaultValue,
  onChange,
  className,
}: ChatWidgetColorFieldProps) {
  const display = normalizeHex(value) ?? defaultValue;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-hairline bg-surface-card px-2">
        <input
          type="color"
          value={display}
          onChange={(e) => onChange(e.target.value)}
          className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label="Pick color"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            const next = normalizeHex(e.target.value);
            if (next) onChange(next);
            else onChange(display);
          }}
          className="h-7 w-[88px] border-0 bg-transparent px-0 text-body-sm shadow-none focus-visible:ring-0"
          placeholder={defaultValue}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-10 shrink-0 rounded-lg border-hairline bg-surface-card"
        onClick={() => onChange(defaultValue)}
        aria-label="Reset color"
      >
        <AppIcon icon={RotateCcw} className="size-3.5" />
      </Button>
    </div>
  );
}
