"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { EMAIL_REPLY_SUBJECT_PREFIX_DEFAULT } from "@/lib/deploy/email-channel-config";

import type { EmailDraft } from "./email-draft";
import type { AgentGmailSettings } from "@/lib/actions/gmail-connection";

type EmailPreviewPanelProps = {
  agentName: string;
  draft: EmailDraft;
  gmailSettings: AgentGmailSettings;
};

export function EmailPreviewPanel({
  agentName,
  draft,
  gmailSettings,
}: EmailPreviewPanelProps) {
  const t = useTranslations("dashboard.deploy.generic");
  const connected = gmailSettings.connection !== null;
  const mailbox = gmailSettings.connection?.googleEmail ?? "you@company.com";
  const prefix = draft.replySubjectPrefix.trim() || EMAIL_REPLY_SUBJECT_PREFIX_DEFAULT;
  const sampleSubject = `${prefix} ${t("orderQuestion")}`;
  const sampleBody = t("orderReply");
  const signature = draft.signature.trim();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-title-sm font-medium text-ink">{t("preview")}</h3>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-6 pb-8">
        {!connected ? (
          <div className="max-w-sm text-center">
            <p className="text-body-sm text-muted">
              {t("emailPreviewDisconnected")}
            </p>
          </div>
        ) : null}

        <div className="flex h-full max-h-[min(720px,100%)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-card shadow-[0_24px_64px_rgba(0,0,0,0.08)]">
          <div className="flex h-9 shrink-0 items-center gap-2 border-b border-hairline-soft bg-canvas-soft/80 px-4">
            <span className="size-3 shrink-0 rounded-full bg-[#ff5f57]" />
            <span className="size-3 shrink-0 rounded-full bg-[#febc2e]" />
            <span className="size-3 shrink-0 rounded-full bg-[#28c840]" />
            <div className="ml-2 flex items-center gap-1.5 text-caption text-muted">
              <Image src="/svg/gmail.svg" alt="" width={14} height={14} className="size-3.5" />
              Gmail — {mailbox}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="rounded-xl border border-hairline bg-canvas-soft/30">
              <div className="border-b border-hairline px-4 py-3 space-y-1">
                <p className="text-caption text-muted-soft">
                  <span className="text-muted">{t("from")}</span>{" "}
                  <span className="text-ink">{t("customerEmail")}</span>
                </p>
                <p className="text-caption text-muted-soft">
                  <span className="text-muted">{t("to")}</span>{" "}
                  <span className="text-ink">{mailbox}</span>
                </p>
                <p className="text-body-sm font-medium text-ink">{t("orderQuestion")}</p>
              </div>
              <div className="px-4 py-3 text-body-sm text-muted">
                {t("orderQuestionMessage")}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-hairline bg-surface-card">
              <div className="border-b border-hairline px-4 py-3 space-y-1">
                <p className="text-caption text-muted-soft">
                  <span className="text-muted">{t("from")}</span>{" "}
                  <span className="text-ink">{mailbox}</span>
                </p>
                <p className="text-caption text-muted-soft">
                  <span className="text-muted">{t("to")}</span>{" "}
                  <span className="text-ink">{t("customerEmail")}</span>
                </p>
                <p className="text-body-sm font-medium text-ink">{sampleSubject}</p>
              </div>
              <div className="px-4 py-3 text-body-sm text-ink leading-relaxed whitespace-pre-wrap">
                {sampleBody}
                {signature ? (
                  <>
                    {"\n\n--\n"}
                    {signature}
                  </>
                ) : null}
              </div>
              <div className="border-t border-hairline-soft px-4 py-2 text-caption text-muted-soft">
                {t("sentBy", { agentName })}
                {!draft.autoReplyEnabled ? ` · ${t("autoReplyOff")}` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
