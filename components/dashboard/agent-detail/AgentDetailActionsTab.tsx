"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ACTION_CATALOG,
  ACTION_CATALOG_TYPE_LABELS,
  type ActionCatalogType,
} from "./action-catalog";
import { ActionCatalogCard } from "./ActionCatalogCard";

const TYPE_FILTER_OPTIONS: { value: ActionCatalogType; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "escalation", label: "Escalation" },
  { value: "custom", label: "Custom" },
  { value: "commerce", label: "Commerce" },
  { value: "live_chat", label: "Live chat" },
  { value: "messaging", label: "Messaging" },
  { value: "scheduling", label: "Scheduling" },
  { value: "utility", label: "Utility" },
];

export function AgentDetailActionsTab() {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<ActionCatalogType>("all");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return ACTION_CATALOG.filter((entry) => {
      if (typeFilter !== "all" && entry.type !== typeFilter) return false;
      if (!q) return true;
      const haystack = [entry.title, entry.description, ...entry.pills]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, typeFilter]);

  const typeFilterLabel =
    typeFilter === "all"
      ? "Type"
      : `Type (${ACTION_CATALOG_TYPE_LABELS[typeFilter]})`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
          Actions
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-body-sm font-medium text-ink hover:bg-canvas-soft"
          onClick={() => toast.message("Coming soon")}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Create action
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 w-full flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-hairline bg-surface-card pl-9 pr-3 text-body-sm text-ink shadow-none placeholder:text-muted-soft focus-visible:border-hairline-strong focus-visible:ring-1 focus-visible:ring-ink/10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 rounded-md border border-hairline bg-surface-card px-2 py-1 text-body-sm font-medium text-body shadow-none hover:bg-canvas-soft sm:self-center"
            >
              {typeFilterLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[10rem] rounded-xl border-hairline bg-surface-card"
          >
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-body-sm text-muted">
          No actions match your search or filter.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <ActionCatalogCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
