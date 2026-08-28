"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppIcon } from "@/components/ui/app-icon";
import { CheckIcon, CopyIcon, Eye, EyeOff, LockIcon, RefreshCwIcon } from "@/lib/icons/app-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/routing";
import { AgentVisibility } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  regenerateAgentWidgetToken,
  updateAgentSecuritySettings,
  updateAgentVisibility,
} from "@/lib/actions/agents";
import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
  chatWidgetFieldTextareaClass,
} from "@/components/dashboard/agent-detail/deploy/chat-widget/ChatWidgetSettingRow";

import type { AgentDetailWithRelations } from "./agent-detail-types";

type AgentDetailSecurityTabProps = {
  agent: AgentDetailWithRelations;
};

function hostnamesToText(hostnames: string[]): string {
  return hostnames.join("\n");
}

export function AgentDetailSecurityTab({ agent }: AgentDetailSecurityTabProps) {
  const t = useTranslations("dashboard.agentDetail.security");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [visibility, setVisibility] = useState(agent.visibility);
  const [widgetToken, setWidgetToken] = useState(agent.widgetToken ?? "");
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [hostnamesText, setHostnamesText] = useState(
    hostnamesToText(agent.allowedHostnames),
  );
  const [rateLimit, setRateLimit] = useState(
    agent.chatRateLimitPerMinute != null
      ? String(agent.chatRateLimitPerMinute)
      : "",
  );
  const [recordingConsent, setRecordingConsent] = useState(
    agent.recordingConsentEnabled,
  );
  const [saveRecordings, setSaveRecordings] = useState(agent.saveRecordings);
  const [retention, setRetention] = useState(
    agent.conversationRetentionDays == null
      ? "keep"
      : String(agent.conversationRetentionDays),
  );
  const [piiRedaction, setPiiRedaction] = useState(agent.piiRedactionEnabled);
  const [stayOnTopic, setStayOnTopic] = useState(agent.guardrailStayOnTopic);
  const [refuseSensitive, setRefuseSensitive] = useState(
    agent.guardrailRefuseSensitive,
  );
  const [escalateWhenUnsure, setEscalateWhenUnsure] = useState(
    agent.guardrailEscalateWhenUnsure,
  );

  useEffect(() => {
    setVisibility(agent.visibility);
    setWidgetToken(agent.widgetToken ?? "");
    setHostnamesText(hostnamesToText(agent.allowedHostnames));
    setRateLimit(
      agent.chatRateLimitPerMinute != null
        ? String(agent.chatRateLimitPerMinute)
        : "",
    );
    setRecordingConsent(agent.recordingConsentEnabled);
    setSaveRecordings(agent.saveRecordings);
    setRetention(
      agent.conversationRetentionDays == null
        ? "keep"
        : String(agent.conversationRetentionDays),
    );
    setPiiRedaction(agent.piiRedactionEnabled);
    setStayOnTopic(agent.guardrailStayOnTopic);
    setRefuseSensitive(agent.guardrailRefuseSensitive);
    setEscalateWhenUnsure(agent.guardrailEscalateWhenUnsure);
  }, [agent]);

  const isPublic = visibility === AgentVisibility.PUBLIC;
  const maskedToken = widgetToken
    ? `${widgetToken.slice(0, 8)}${"•".repeat(24)}`
    : "";

  function save(
    input: Parameters<typeof updateAgentSecuritySettings>[1],
    rollback?: () => void,
  ) {
    startTransition(async () => {
      const result = await updateAgentSecuritySettings(agent.id, input);
      if (!result.success) {
        rollback?.();
        toast.error(result.error ?? t("failedSave"));
        return;
      }
      router.refresh();
    });
  }

  function handleVisibility(checked: boolean) {
    const next = checked ? AgentVisibility.PUBLIC : AgentVisibility.PRIVATE;
    const previous = visibility;
    startTransition(async () => {
      setVisibility(next);
      const result = await updateAgentVisibility(agent.id, next);
      if (!result.success) {
        setVisibility(previous);
        toast.error(result.error ?? t("failedSave"));
        return;
      }
      router.refresh();
    });
  }

  async function handleCopyToken() {
    if (!widgetToken) return;
    try {
      await navigator.clipboard.writeText(widgetToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t("tokenCopied"));
    } catch {
      toast.error(t("couldNotCopy"));
    }
  }

  function handleRotateToken() {
    setConfirmRotate(false);
    startTransition(async () => {
      const result = await regenerateAgentWidgetToken(agent.id);
      if (!result.success) {
        toast.error(result.error ?? t("couldNotRotate"));
        return;
      }
      setWidgetToken(result.data.widgetToken);
      toast.success(widgetToken ? t("tokenRotated") : t("tokenGenerated"));
      router.refresh();
    });
  }

  function handleHostnamesBlur() {
    const current = hostnamesToText(agent.allowedHostnames);
    if (hostnamesText.trim() === current.trim()) return;
    save({ allowedHostnamesText: hostnamesText }, () =>
      setHostnamesText(current),
    );
  }

  function handleRateLimitBlur() {
    const trimmed = rateLimit.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    const previous =
      agent.chatRateLimitPerMinute != null
        ? String(agent.chatRateLimitPerMinute)
        : "";
    if (next === agent.chatRateLimitPerMinute) return;
    if (next !== null && (!Number.isInteger(next) || next < 1 || next > 120)) {
      setRateLimit(previous);
      toast.error(t("failedSave"));
      return;
    }
    save({ chatRateLimitPerMinute: next }, () => setRateLimit(previous));
  }

  function handleRetention(value: string) {
    const previous = retention;
    setRetention(value);
    const days = value === "keep" ? null : Number(value);
    save(
      {
        conversationRetentionDays:
          days === 7 || days === 30 || days === 90 || days === 365
            ? days
            : null,
      },
      () => setRetention(previous),
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <section className="rounded-xl border border-hairline bg-surface-card px-4">
        <div className="pt-4 pb-1">
          <h2 className="text-title-sm text-ink">{t("access.title")}</h2>
          <p className="mt-0.5 text-body-sm text-muted">{t("access.description")}</p>
        </div>
        <ChatWidgetSettingRow
          label={t("access.visibility")}
          description={
            isPublic ? t("access.publicHint") : t("access.privateHint")
          }
          variant="row"
        >
          <div className="flex items-center gap-2">
            <span className="text-caption font-medium text-ink">
              {isPublic ? t("access.public") : t("access.private")}
            </span>
            <Switch
              size="sm"
              checked={isPublic}
              disabled={pending}
              onCheckedChange={handleVisibility}
              aria-label={t("access.visibility")}
            />
          </div>
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow
          label={t("access.widgetToken")}
          description={t("access.widgetTokenDescription")}
        >
          <div className="flex gap-2">
            <input
              readOnly
              type={showToken ? "text" : "password"}
              value={showToken ? widgetToken : maskedToken}
              className={cn(chatWidgetFieldInputClass, "font-mono text-caption")}
              aria-label={t("access.widgetToken")}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0 rounded-lg border-hairline"
              disabled={!widgetToken}
              onClick={() => setShowToken((v) => !v)}
              aria-label={showToken ? t("access.hideToken") : t("access.showToken")}
            >
              {showToken ? (
                <AppIcon icon={EyeOff} className="size-4" />
              ) : (
                <AppIcon icon={Eye} className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0 rounded-lg border-hairline"
              disabled={!widgetToken}
              onClick={() => void handleCopyToken()}
              aria-label={t("access.copyToken")}
            >
              {copied ? (
                <AppIcon icon={CheckIcon} className="size-4" />
              ) : (
                <AppIcon icon={CopyIcon} className="size-4" />
              )}
            </Button>
          </div>
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg border-hairline text-body-sm"
              disabled={pending}
              onClick={() => setConfirmRotate(true)}
            >
              <AppIcon
                icon={RefreshCwIcon}
                className={cn("size-3.5", pending && "animate-spin")}
              />
              {widgetToken ? t("access.rotateToken") : t("access.generateToken")}
            </Button>
          </div>
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow label={t("access.apiTokenLink")} noBorder>
          <Link
            href={`/dashboard/agents/${agent.id}/deploy/api`}
            className="text-body-sm text-primary hover:underline"
          >
            {t("access.apiTokenLinkLabel")}
          </Link>
        </ChatWidgetSettingRow>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card px-4">
        <div className="pt-4 pb-1">
          <h2 className="text-title-sm text-ink">{t("domains.title")}</h2>
          <p className="mt-0.5 text-body-sm text-muted">{t("domains.description")}</p>
        </div>
        <ChatWidgetSettingRow label={t("domains.list")} description={t("domains.hint")} noBorder>
          <Textarea
            value={hostnamesText}
            onChange={(e) => setHostnamesText(e.target.value)}
            onBlur={handleHostnamesBlur}
            disabled={pending}
            placeholder={t("domains.placeholder")}
            className={chatWidgetFieldTextareaClass}
            rows={4}
          />
        </ChatWidgetSettingRow>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card px-4">
        <div className="pt-4 pb-1">
          <h2 className="text-title-sm text-ink">{t("rateLimit.title")}</h2>
          <p className="mt-0.5 text-body-sm text-muted">{t("rateLimit.description")}</p>
        </div>
        <ChatWidgetSettingRow
          label={t("rateLimit.perMinute")}
          description={t("rateLimit.none")}
          noBorder
        >
          <input
            type="number"
            min={1}
            max={120}
            inputMode="numeric"
            value={rateLimit}
            onChange={(e) => setRateLimit(e.target.value)}
            onBlur={handleRateLimitBlur}
            disabled={pending}
            placeholder={t("rateLimit.placeholder")}
            className={cn(chatWidgetFieldInputClass, "max-w-[8rem]")}
            aria-label={t("rateLimit.perMinute")}
          />
        </ChatWidgetSettingRow>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card px-4">
        <div className="pt-4 pb-1">
          <h2 className="text-title-sm text-ink">{t("privacy.title")}</h2>
          <p className="mt-0.5 text-body-sm text-muted">{t("privacy.description")}</p>
        </div>
        <ChatWidgetSettingRow
          label={t("privacy.recordingConsent")}
          description={t("privacy.recordingConsentDescription")}
          variant="row"
        >
          <Switch
            checked={recordingConsent}
            disabled={pending}
            onCheckedChange={(checked) => {
              setRecordingConsent(checked);
              save({ recordingConsentEnabled: checked }, () =>
                setRecordingConsent(!checked),
              );
            }}
          />
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow
          label={t("privacy.saveRecordings")}
          description={t("privacy.saveRecordingsDescription")}
          variant="row"
        >
          <Switch
            checked={saveRecordings}
            disabled={pending}
            onCheckedChange={(checked) => {
              setSaveRecordings(checked);
              save({ saveRecordings: checked }, () => setSaveRecordings(!checked));
            }}
          />
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow
          label={t("privacy.retention")}
          description={t("privacy.retentionDescription")}
        >
          <Select value={retention} onValueChange={handleRetention} disabled={pending}>
            <SelectTrigger className="h-10 w-full rounded-lg border-hairline bg-surface-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keep">{t("privacy.keep")}</SelectItem>
              <SelectItem value="7">{t("privacy.days7")}</SelectItem>
              <SelectItem value="30">{t("privacy.days30")}</SelectItem>
              <SelectItem value="90">{t("privacy.days90")}</SelectItem>
              <SelectItem value="365">{t("privacy.days365")}</SelectItem>
            </SelectContent>
          </Select>
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow
          label={t("privacy.piiRedaction")}
          description={t("privacy.piiRedactionDescription")}
          variant="row"
        >
          <Switch
            checked={piiRedaction}
            disabled={pending}
            onCheckedChange={(checked) => {
              setPiiRedaction(checked);
              save({ piiRedactionEnabled: checked }, () => setPiiRedaction(!checked));
            }}
          />
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow
          label={t("privacy.neverCollect")}
          description={t("privacy.neverCollectDescription")}
          variant="row"
          noBorder
        >
          <div className="flex items-center gap-2 text-muted">
            <AppIcon icon={LockIcon} className="size-3.5" />
            <Switch checked disabled aria-label={t("privacy.neverCollect")} />
          </div>
        </ChatWidgetSettingRow>
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card px-4">
        <div className="pt-4 pb-1">
          <h2 className="text-title-sm text-ink">{t("guardrails.title")}</h2>
          <p className="mt-0.5 text-body-sm text-muted">{t("guardrails.description")}</p>
        </div>
        <ChatWidgetSettingRow
          label={t("guardrails.stayOnTopic")}
          description={t("guardrails.stayOnTopicDescription")}
          variant="row"
        >
          <Switch
            checked={stayOnTopic}
            disabled={pending}
            onCheckedChange={(checked) => {
              setStayOnTopic(checked);
              save({ guardrailStayOnTopic: checked }, () => setStayOnTopic(!checked));
            }}
          />
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow
          label={t("guardrails.refuseSensitive")}
          description={t("guardrails.refuseSensitiveDescription")}
          variant="row"
        >
          <Switch
            checked={refuseSensitive}
            disabled={pending}
            onCheckedChange={(checked) => {
              setRefuseSensitive(checked);
              save({ guardrailRefuseSensitive: checked }, () =>
                setRefuseSensitive(!checked),
              );
            }}
          />
        </ChatWidgetSettingRow>
        <ChatWidgetSettingRow
          label={t("guardrails.escalateWhenUnsure")}
          description={t("guardrails.escalateWhenUnsureDescription")}
          variant="row"
          noBorder
        >
          <Switch
            checked={escalateWhenUnsure}
            disabled={pending}
            onCheckedChange={(checked) => {
              setEscalateWhenUnsure(checked);
              save({ guardrailEscalateWhenUnsure: checked }, () =>
                setEscalateWhenUnsure(!checked),
              );
            }}
          />
        </ChatWidgetSettingRow>
      </section>

      <Dialog open={confirmRotate} onOpenChange={setConfirmRotate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {widgetToken ? t("access.rotateTitle") : t("access.generateToken")}
            </DialogTitle>
            <DialogDescription>{t("access.rotateDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-hairline"
              onClick={() => setConfirmRotate(false)}
            >
              {t("access.cancel")}
            </Button>
            <Button
              type="button"
              className="btn-primary rounded-lg"
              onClick={handleRotateToken}
            >
              {widgetToken ? t("access.rotateConfirm") : t("access.generateToken")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
