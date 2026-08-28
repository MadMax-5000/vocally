"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AgentTone, AgentType, CreativityLevel } from "@prisma/client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/routing";
import { updateAgentAdvancedSettings } from "@/lib/actions/agents";
import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
  chatWidgetFieldTextareaClass,
} from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSettingRow";

import type { AgentDetailWithRelations } from "./agent-detail-types";

type AgentDetailAdvancedTabProps = {
  agent: AgentDetailWithRelations;
};

const AGENT_TYPES = Object.values(AgentType);
const AGENT_TONES = Object.values(AgentTone);
const CREATIVITY_LEVELS = Object.values(CreativityLevel);

function enumTranslationKey(value: string) {
  return value.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function AgentDetailAdvancedTab({ agent }: AgentDetailAdvancedTabProps) {
  const t = useTranslations("dashboard.agentDetail.advanced");
  const agents = useTranslations("dashboard.agents");
  const wizard = useTranslations("dashboard.agents.wizard");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(agent.name);
  const [agentType, setAgentType] = useState(agent.agentType);
  const [customRole, setCustomRole] = useState(agent.customRole ?? "");
  const [description, setDescription] = useState(agent.description ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(agent.websiteUrl ?? "");
  const [tone, setTone] = useState(agent.tone);
  const [customTone, setCustomTone] = useState(agent.customTone ?? "");
  const [creativity, setCreativity] = useState(agent.creativity);

  useEffect(() => {
    setName(agent.name);
    setAgentType(agent.agentType);
    setCustomRole(agent.customRole ?? "");
    setDescription(agent.description ?? "");
    setWebsiteUrl(agent.websiteUrl ?? "");
    setTone(agent.tone);
    setCustomTone(agent.customTone ?? "");
    setCreativity(agent.creativity);
  }, [agent]);

  function save(
    input: Parameters<typeof updateAgentAdvancedSettings>[1],
    rollback?: () => void,
  ) {
    startTransition(async () => {
      const result = await updateAgentAdvancedSettings(agent.id, input);
      if (!result.success) {
        rollback?.();
        toast.error(result.error ?? t("failedSave"));
        return;
      }
      router.refresh();
    });
  }

  function handleNameBlur() {
    const next = name.trim();
    if (!next) {
      setName(agent.name);
      return;
    }
    if (next === agent.name) {
      setName(agent.name);
      return;
    }
    const previous = agent.name;
    setName(next);
    save({ name: next }, () => setName(previous));
  }

  function handleType(next: AgentType) {
    if (next === agentType) return;
    const previousType = agentType;
    const previousRole = customRole;
    setAgentType(next);
    if (next !== AgentType.CUSTOM) {
      setCustomRole("");
      save({ agentType: next, customRole: null }, () => {
        setAgentType(previousType);
        setCustomRole(previousRole);
      });
      return;
    }
    save({ agentType: next }, () => setAgentType(previousType));
  }

  function handleCustomRoleBlur() {
    const next = customRole.trim();
    const previous = agent.customRole ?? "";
    if (next === previous) {
      setCustomRole(previous);
      return;
    }
    setCustomRole(next);
    save({ customRole: next || null }, () => setCustomRole(previous));
  }

  function handleDescriptionBlur() {
    const next = description.trim();
    const previous = agent.description ?? "";
    if (!next) {
      setDescription(previous);
      return;
    }
    if (next === previous) {
      setDescription(previous);
      return;
    }
    setDescription(next);
    save({ description: next }, () => setDescription(previous));
  }

  function handleWebsiteBlur() {
    const next = websiteUrl.trim();
    const previous = agent.websiteUrl ?? "";
    if (next === previous) {
      setWebsiteUrl(previous);
      return;
    }
    setWebsiteUrl(next);
    save({ websiteUrl: next || null }, () => setWebsiteUrl(previous));
  }

  function handleTone(next: AgentTone) {
    if (next === tone) return;
    const previous = tone;
    setTone(next);
    save({ tone: next }, () => setTone(previous));
  }

  function handleCustomToneBlur() {
    const next = customTone.trim();
    const previous = agent.customTone ?? "";
    if (next === previous) {
      setCustomTone(previous);
      return;
    }
    setCustomTone(next);
    save({ customTone: next || null }, () => setCustomTone(previous));
  }

  function handleCreativity(next: CreativityLevel) {
    if (next === creativity) return;
    const previous = creativity;
    setCreativity(next);
    save({ creativity: next }, () => setCreativity(previous));
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <section className="rounded-xl border border-hairline bg-surface-card px-4">
        <div className="pt-4 pb-1">
          <h2 className="text-title-sm text-ink">{t("identity.title")}</h2>
          <p className="mt-0.5 text-body-sm text-muted">{t("identity.description")}</p>
        </div>
        <ChatWidgetSettingRow
          label={t("identity.name")}
          description={t("identity.nameDescription")}
        >
          <Input
            value={name}
            maxLength={50}
            disabled={pending}
            onChange={(e) => setName(e.target.value.slice(0, 50))}
            onBlur={handleNameBlur}
            className={chatWidgetFieldInputClass}
            aria-label={t("identity.name")}
          />
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow
          label={t("identity.type")}
          description={t("identity.typeDescription")}
        >
          <Select
            value={agentType}
            onValueChange={(value) => handleType(value as AgentType)}
            disabled={pending}
          >
            <SelectTrigger className="h-10 w-full rounded-lg border-hairline bg-surface-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGENT_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {agents(`agentTypes.${enumTranslationKey(value)}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ChatWidgetSettingRow>
        {agentType === AgentType.CUSTOM ? (
          <ChatWidgetSettingRow
            label={t("identity.customRole")}
            description={t("identity.customRoleDescription")}
          >
            <Input
              value={customRole}
              maxLength={120}
              disabled={pending}
              placeholder={t("identity.customRolePlaceholder")}
              onChange={(e) => setCustomRole(e.target.value.slice(0, 120))}
              onBlur={handleCustomRoleBlur}
              className={chatWidgetFieldInputClass}
              aria-label={t("identity.customRole")}
            />
          </ChatWidgetSettingRow>
        ) : null}
        <ChatWidgetSettingRow
          label={t("identity.mainGoal")}
          description={t("identity.mainGoalDescription")}
        >
          <Textarea
            value={description}
            maxLength={500}
            disabled={pending}
            placeholder={t("identity.mainGoalPlaceholder")}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            onBlur={handleDescriptionBlur}
            className={chatWidgetFieldTextareaClass}
            aria-label={t("identity.mainGoal")}
          />
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow
          label={t("identity.website")}
          description={t("identity.websiteDescription")}
          noBorder
        >
          <Input
            type="url"
            value={websiteUrl}
            maxLength={500}
            disabled={pending}
            placeholder={t("identity.websitePlaceholder")}
            onChange={(e) => setWebsiteUrl(e.target.value.slice(0, 500))}
            onBlur={handleWebsiteBlur}
            className={chatWidgetFieldInputClass}
            aria-label={t("identity.website")}
          />
        </ChatWidgetSettingRow>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card px-4">
        <div className="pt-4 pb-1">
          <h2 className="text-title-sm text-ink">{t("personality.title")}</h2>
          <p className="mt-0.5 text-body-sm text-muted">
            {t("personality.description")}
          </p>
        </div>
        <ChatWidgetSettingRow
          label={t("personality.tone")}
          description={t("personality.toneDescription")}
        >
          <Select
            value={tone}
            onValueChange={(value) => handleTone(value as AgentTone)}
            disabled={pending}
          >
            <SelectTrigger className="h-10 w-full rounded-lg border-hairline bg-surface-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGENT_TONES.map((value) => (
                <SelectItem key={value} value={value}>
                  {wizard(enumTranslationKey(value))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow
          label={t("personality.customTone")}
          description={t("personality.customToneDescription")}
        >
          <Input
            value={customTone}
            maxLength={120}
            disabled={pending}
            placeholder={t("personality.customTonePlaceholder")}
            onChange={(e) => setCustomTone(e.target.value.slice(0, 120))}
            onBlur={handleCustomToneBlur}
            className={chatWidgetFieldInputClass}
            aria-label={t("personality.customTone")}
          />
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow
          label={t("personality.creativity")}
          description={t("personality.creativityDescription")}
          noBorder
        >
          <Select
            value={creativity}
            onValueChange={(value) => handleCreativity(value as CreativityLevel)}
            disabled={pending}
          >
            <SelectTrigger className="h-10 w-full rounded-lg border-hairline bg-surface-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CREATIVITY_LEVELS.map((value) => (
                <SelectItem key={value} value={value}>
                  {wizard(enumTranslationKey(value))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ChatWidgetSettingRow>
      </section>
    </div>
  );
}
