"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { InfoIcon, PlusIcon, Trash2Icon } from "@/lib/icons/app-icons"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HelpPageNavLink } from "@/lib/deploy/web-chat-config";
import { cn } from "@/lib/utils";

import { chatWidgetFieldInputClass } from "../chat-widget/ChatWidgetSettingRow";

type HelpPageNavLinksEditorProps = {
  links: HelpPageNavLink[];
  onChange: (links: HelpPageNavLink[]) => void;
};

export function HelpPageNavLinksEditor({ links, onChange }: HelpPageNavLinksEditorProps) {
  function updateLink(index: number, patch: Partial<HelpPageNavLink>) {
    const next = [...links];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  function addLink() {
    if (links.length >= 8) return;
    const hasPrimary = links.some((l) => l.variant === "primary");
    onChange([
      ...links,
      { label: "", href: "", variant: hasPrimary ? "default" : "primary" },
    ]);
  }

  function setPrimary(index: number) {
    onChange(
      links.map((l, i) => ({
        ...l,
        variant: i === index ? "primary" : "default",
      })),
    );
  }

  return (
    <div className="space-y-3 border-b border-hairline py-4">
      <div className="flex items-center gap-1.5">
        <h4 className="text-body-sm text-muted">Sidebar navigation</h4>
        <span title="Buttons shown in the help page sidebar. Primary uses a filled style.">
          <AppIcon icon={InfoIcon} className="size-3.5 text-muted-soft" aria-hidden />
        </span>
      </div>
      <p className="text-caption text-muted-soft">
        Add links for your customers (e.g. docs, pricing). Opens in a new tab.
      </p>

      {links.length === 0 ? (
        <p className="py-2 text-center text-body-sm text-muted-soft">No sidebar links yet</p>
      ) : (
        <ul className="space-y-3">
          {links.map((link, index) => (
            <li
              key={index}
              className="rounded-lg border border-hairline bg-canvas-soft/50 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors",
                    link.variant === "primary"
                      ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
                      : "bg-surface-strong text-muted hover:text-ink",
                  )}
                >
                  {link.variant === "primary" ? "Primary" : "Set as primary"}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted hover:text-error"
                  onClick={() => removeLink(index)}
                  aria-label="Remove link"
                >
                  <AppIcon icon={Trash2Icon} className="size-4" />
                </Button>
              </div>
              <Input
                value={link.label}
                onChange={(e) => updateLink(index, { label: e.target.value })}
                placeholder="Button label"
                className={chatWidgetFieldInputClass}
              />
              <Input
                value={link.href}
                onChange={(e) => updateLink(index, { href: e.target.value })}
                placeholder="https://example.com or /docs"
                className={chatWidgetFieldInputClass}
              />
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full rounded-lg border-hairline bg-surface-card text-body-sm"
        onClick={addLink}
        disabled={links.length >= 8}
      >
        <AppIcon icon={PlusIcon} className="mr-1.5 size-4" />
        Add sidebar link
      </Button>
    </div>
  );
}
