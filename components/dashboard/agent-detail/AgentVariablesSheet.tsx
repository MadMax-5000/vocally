"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Braces, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteAgentVariable, upsertAgentVariable } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import type { AgentDetailWithRelations } from "./agent-detail-types";
import { formatEnumLabel } from "./format-agent-labels";

function buildSystemVariableRows(agent: AgentDetailWithRelations) {
  const toneDisplay = agent.customTone?.trim()
    ? `${formatEnumLabel(agent.tone)} — ${agent.customTone}`
    : formatEnumLabel(agent.tone);
  const channels =
    agent.channels
      .filter((c) => c.enabled)
      .map((c) => formatEnumLabel(c.channel))
      .join(", ") || "—";
  const languages =
    agent.languages.length > 0
      ? agent.languages.map((l) => formatEnumLabel(l.language)).join(", ")
      : "—";

  return [
    { key: "name", label: "Name", token: "{{ name }}", value: agent.name },
    { key: "tone", label: "Tone", token: "{{ tone }}", value: toneDisplay },
    {
      key: "agent_type",
      label: "Agent type",
      token: "{{ agent_type }}",
      value: formatEnumLabel(agent.agentType),
    },
    {
      key: "creativity",
      label: "Creativity",
      token: "{{ creativity }}",
      value: formatEnumLabel(agent.creativity),
    },
    {
      key: "channels",
      label: "Channels",
      token: "{{ channels }}",
      value: channels,
    },
    {
      key: "languages",
      label: "Languages",
      token: "{{ languages }}",
      value: languages,
    },
    {
      key: "custom_role",
      label: "Custom role",
      token: "{{ custom_role }}",
      value: agent.customRole?.trim() || "—",
    },
    {
      key: "website",
      label: "Website",
      token: "{{ website }}",
      value: agent.websiteUrl?.trim() || "—",
    },
    {
      key: "handoff",
      label: "Handoff",
      token: "{{ handoff }}",
      value: agent.handoffEnabled ? "On" : "Off",
    },
  ] as const;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  } catch {
    toast.error("Could not copy");
  }
}

type AgentVariablesSheetProps = {
  agent: AgentDetailWithRelations;
};

export function AgentVariablesSheet({ agent }: AgentVariablesSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const systemRows = buildSystemVariableRows(agent);

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [edits, setEdits] = useState<Record<string, { value: string; description: string }>>(
    {},
  );

  function handleSaveCustom(id: string, key: string) {
    const row = agent.variables.find((v) => v.id === id);
    const value = edits[id]?.value ?? row?.value ?? "";
    const description = edits[id]?.description ?? (row?.description ?? "");
    startTransition(async () => {
      const result = await upsertAgentVariable(agent.id, {
        key,
        value,
        description: description.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.error ?? "Save failed");
        return;
      }
      setEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      router.refresh();
      toast.success("Variable saved");
    });
  }

  function handleAdd() {
    startTransition(async () => {
      const result = await upsertAgentVariable(agent.id, {
        key: newKey.trim(),
        value: newValue.trim(),
        description: newDescription.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.error ?? "Could not add variable");
        return;
      }
      setNewKey("");
      setNewValue("");
      setNewDescription("");
      router.refresh();
      toast.success("Variable added");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAgentVariable(id);
      if (!result.success) {
        toast.error(result.error ?? "Delete failed");
        return;
      }
      router.refresh();
      toast.success("Variable removed");
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 border-hairline-strong px-2.5 text-body-sm text-ink"
        >
          <Braces className="h-3.5 w-3.5" />
          Variables
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader className="border-b border-hairline pb-4 text-left">
          <SheetTitle>Variables</SheetTitle>
          <SheetDescription>
            System fields and custom key/value pairs for prompts and integrations.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-8 py-6">
          <section className="space-y-3">
            <h3 className="text-caption-uppercase text-muted">System variables</h3>
            <ul className="space-y-2">
              {systemRows.map((row) => (
                <li
                  key={row.key}
                  className="flex items-start justify-between gap-3 rounded-lg border border-hairline bg-surface-card px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-body-sm font-medium text-ink">{row.label}</p>
                    <p className="font-mono text-caption text-muted">{row.token}</p>
                    <p className="text-body-sm text-body">{row.value}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted hover:text-ink"
                    aria-label={`Copy ${row.token}`}
                    onClick={() => void copyText(row.token)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-caption-uppercase text-muted">Custom variables</h3>
            <ul className="space-y-3">
              {agent.variables.map((v) => {
                const descDefault = v.description ?? "";
                const valueDisplay = edits[v.id]?.value ?? v.value;
                const descDisplay = edits[v.id]?.description ?? descDefault;
                return (
                  <li
                    key={v.id}
                    className="space-y-2 rounded-lg border border-hairline bg-surface-card p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-body-sm font-medium text-ink">
                        {`{{ ${v.key} }}`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted hover:text-semantic-error"
                        aria-label="Delete variable"
                        disabled={pending}
                        onClick={() => handleDelete(v.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`var-val-${v.id}`} className="text-caption text-muted">
                        Value
                      </Label>
                      <Textarea
                        id={`var-val-${v.id}`}
                        value={valueDisplay}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [v.id]: {
                              value: e.target.value,
                              description: prev[v.id]?.description ?? descDefault,
                            },
                          }))
                        }
                        rows={2}
                        className="resize-y text-body-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`var-desc-${v.id}`} className="text-caption text-muted">
                        Description (optional)
                      </Label>
                      <Input
                        id={`var-desc-${v.id}`}
                        value={descDisplay}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [v.id]: {
                              value: prev[v.id]?.value ?? v.value,
                              description: e.target.value,
                            },
                          }))
                        }
                        className="text-body-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-hairline-strong"
                      disabled={pending}
                      onClick={() => handleSaveCustom(v.id, v.key)}
                    >
                      Save
                    </Button>
                  </li>
                );
              })}
            </ul>

            <div className="space-y-3 rounded-lg border border-dashed border-hairline-strong bg-canvas-soft p-3">
              <p className="text-caption-uppercase text-muted">Add variable</p>
              <div className="space-y-1.5">
                <Label htmlFor="new-var-key" className="text-caption text-muted">
                  Key (snake_case)
                </Label>
                <Input
                  id="new-var-key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. brand_voice"
                  className="font-mono text-body-sm"
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-var-value" className="text-caption text-muted">
                  Value
                </Label>
                <Textarea
                  id="new-var-value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  rows={2}
                  className="resize-y text-body-sm"
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-var-desc" className="text-caption text-muted">
                  Description (optional)
                </Label>
                <Input
                  id="new-var-desc"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="text-body-sm"
                  disabled={pending}
                />
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="w-full"
                disabled={pending || !newKey.trim() || !newValue.trim()}
                onClick={handleAdd}
              >
                Add variable
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
