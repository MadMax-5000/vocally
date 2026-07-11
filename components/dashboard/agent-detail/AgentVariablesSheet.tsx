"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { Braces, CopyIcon, Trash2Icon } from "@/lib/icons/app-icons"

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { deleteAgentVariable, upsertAgentVariable } from "@/lib/actions/agents";
import { getEnabledAgentChannelTypes } from "@/lib/deploy/web-chat-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import type { AgentDetailWithRelations } from "./agent-detail-types";
import { cn } from "@/lib/utils";

function enumTranslationKey(value: string) {
  return value.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function buildSystemVariableRows(
  agent: AgentDetailWithRelations,
  t: ReturnType<typeof useTranslations>,
  agents: ReturnType<typeof useTranslations>,
) {
  const toneDisplay = agent.customTone?.trim()
    ? `${agents(`wizard.${enumTranslationKey(agent.tone)}`)} — ${agent.customTone}`
    : agents(`wizard.${enumTranslationKey(agent.tone)}`);
  const channels =
    getEnabledAgentChannelTypes(agent.channels)
      .map((channel) => agents(`channels.${enumTranslationKey(channel)}`))
      .join(", ") || "—";
  const languages =
    agent.languages.length > 0
      ? agent.languages.map((l) => agents(l.language.toLowerCase())).join(", ")
      : "—";

  return [
    { key: "name", label: t("systemName"), token: "{{ name }}", value: agent.name },
    { key: "tone", label: t("systemTone"), token: "{{ tone }}", value: toneDisplay },
    {
      key: "agent_type",
      label: t("systemAgentType"),
      token: "{{ agent_type }}",
      value: agents(`agentTypes.${enumTranslationKey(agent.agentType)}`),
    },
    {
      key: "creativity",
      label: t("systemCreativity"),
      token: "{{ creativity }}",
      value: agents(`wizard.${enumTranslationKey(agent.creativity)}`),
    },
    {
      key: "channels",
      label: t("systemChannels"),
      token: "{{ channels }}",
      value: channels,
    },
    {
      key: "languages",
      label: t("systemLanguages"),
      token: "{{ languages }}",
      value: languages,
    },
    {
      key: "custom_role",
      label: t("systemCustomRole"),
      token: "{{ custom_role }}",
      value: agent.customRole?.trim() || "—",
    },
    {
      key: "website",
      label: t("systemWebsite"),
      token: "{{ website }}",
      value: agent.websiteUrl?.trim() || "—",
    },
    {
      key: "handoff",
      label: t("systemHandoff"),
      token: "{{ handoff }}",
      value: agent.handoffEnabled ? t("on") : t("off"),
    },
  ] as const;
}

async function copyText(text: string, t: ReturnType<typeof useTranslations>) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(t("copied"));
  } catch {
    toast.error(t("couldNotCopy"));
  }
}

type AgentVariablesSheetProps = {
  agent: AgentDetailWithRelations;
  triggerClassName?: string;
};

export function AgentVariablesSheet({ agent, triggerClassName }: AgentVariablesSheetProps) {
  const t = useTranslations("dashboard.agentDetail.variablesSheet");
  const agents = useTranslations("dashboard.agents");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const systemRows = buildSystemVariableRows(agent, t, agents);
  const customVariableCount = agent.variables.length;

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
        toast.error(result.error ?? t("saveFailed"));
        return;
      }
      setEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      router.refresh();
      toast.success(t("variableSaved"));
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
        toast.error(result.error ?? t("couldNotAdd"));
        return;
      }
      setNewKey("");
      setNewValue("");
      setNewDescription("");
      router.refresh();
      toast.success(t("variableAdded"));
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAgentVariable(id);
      if (!result.success) {
        toast.error(result.error ?? t("deleteFailed"));
        return;
      }
      router.refresh();
      toast.success(t("variableRemoved"));
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "group h-7 gap-1.5 rounded-none border-0 px-2.5 text-body-sm font-medium text-ink shadow-none hover:bg-surface-strong",
                triggerClassName,
              )}
            >
              <AppIcon
                icon={Braces}
                className="h-3.5 w-3.5 text-muted transition-colors group-hover:text-ink"
              />
              {t("title")}
              {customVariableCount > 0 ? (
                <span className="ml-0.5 tabular-nums text-caption text-muted">
                  {customVariableCount}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("manageVariables")}</TooltipContent>
      </Tooltip>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader className="border-b border-hairline pb-4 text-left">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>
            {t("description")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-8 py-6">
          <section className="space-y-3">
            <h3 className="text-caption-uppercase text-muted">{t("systemVariables")}</h3>
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
                    aria-label={t("copyToken", { token: row.token })}
                    onClick={() => void copyText(row.token, t)}
                  >
                    <AppIcon icon={CopyIcon} className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-caption-uppercase text-muted">{t("customVariables")}</h3>
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
                        aria-label={t("deleteVariable")}
                        disabled={pending}
                        onClick={() => handleDelete(v.id)}
                      >
                        <AppIcon icon={Trash2Icon} className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`var-val-${v.id}`} className="text-caption text-muted">
                        {t("value")}
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
                        {t("optionalDescription")}
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
                      {t("save")}
                    </Button>
                  </li>
                );
              })}
            </ul>

            <div className="space-y-3 rounded-lg border border-dashed border-hairline-strong bg-canvas-soft p-3">
              <p className="text-caption-uppercase text-muted">{t("addVariable")}</p>
              <div className="space-y-1.5">
                <Label htmlFor="new-var-key" className="text-caption text-muted">
                  {t("key")}
                </Label>
                <Input
                  id="new-var-key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder={t("keyPlaceholder")}
                  className="font-mono text-body-sm"
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-var-value" className="text-caption text-muted">
                  {t("value")}
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
                  {t("optionalDescription")}
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
                {t("addVariable")}
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
