"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import type { OrgLeadRow } from "@/lib/actions/leads";
import { listOrgLeads } from "@/lib/actions/leads";
import type { SidebarAgentListItem } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const CHANNEL_META: Record<string, { src: string; labelKey: string }> = {
  VOICE: { src: "/svg/call.svg", labelKey: "channels.voice" },
  CHAT: { src: "/svg/chat.svg", labelKey: "channels.chat" },
  SMS: { src: "/svg/send.svg", labelKey: "channels.sms" },
  WHATSAPP: { src: "/svg/whatsapp-icon.svg", labelKey: "channels.whatsApp" },
  EMAIL: { src: "/svg/gmail.svg", labelKey: "channels.email" },
};

const CAPTURE_TYPE_LABEL_KEYS: Record<OrgLeadRow["captureType"], string> = {
  collect_leads: "captureTypes.collectLeads",
  custom_form: "captureTypes.customForm",
};

const CAPTURE_TYPE_PILLS: Record<OrgLeadRow["captureType"], string> = {
  collect_leads: "bg-sky-50 text-sky-700 ring-sky-100",
  custom_form: "bg-violet-50 text-violet-700 ring-violet-100",
};

const CHIP_TRIGGER =
  "h-8 shrink-0 rounded-md border border-hairline bg-surface-card px-2.5 text-xs font-medium shadow-none transition-colors";

function formatLeadDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function FilterChip({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string | null; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const activeOption =
    value !== null ? options.find((o) => o.value === value) : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            CHIP_TRIGGER,
            activeOption
              ? "text-ink hover:bg-canvas-soft"
              : "text-muted hover:bg-canvas-soft hover:text-body",
          )}
        >
          {activeOption ? activeOption.label : label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[10rem] rounded-xl border-hairline bg-surface-card"
      >
        <DropdownMenuItem
          onClick={() => onChange(null)}
          className={cn("text-body-sm", value === null && "bg-surface-strong font-medium")}
        >
          All
        </DropdownMenuItem>
        {options.map((opt) => (
          <DropdownMenuItem
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={cn(
              "text-body-sm",
              value === opt.value && "bg-surface-strong font-medium",
            )}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: {
  lead: OrgLeadRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("dashboard.leads");
  const locale = useLocale();
  if (!lead) return null;

  const fields: { label: string; value: string | null }[] =
    lead.captureType === "collect_leads"
      ? [
          { label: t("fields.name"), value: lead.name },
          { label: t("fields.email"), value: lead.email },
          { label: t("fields.phone"), value: lead.phone },
          { label: t("fields.company"), value: lead.company },
          { label: t("fields.notes"), value: lead.notes },
        ]
      : Object.entries(lead.detail ?? {}).map(([label, value]) => ({
          label,
          value,
        }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-hairline bg-surface-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-display-sm text-ink">
            {lead.label}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-caption font-medium ring-1 ring-inset",
                CAPTURE_TYPE_PILLS[lead.captureType],
              )}
            >
              {t(CAPTURE_TYPE_LABEL_KEYS[lead.captureType])}
            </span>
            {lead.channel && CHANNEL_META[lead.channel] ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-strong px-2 py-0.5 text-caption text-muted">
                <Image
                  src={CHANNEL_META[lead.channel].src}
                  alt=""
                  width={12}
                  height={12}
                />
                {t(CHANNEL_META[lead.channel].labelKey)}
              </span>
            ) : null}
          </div>

          <dl className="space-y-3">
            <div>
              <dt className="text-caption text-muted-soft">{t("fields.agent")}</dt>
              <dd className="text-body-sm text-ink">{lead.agentName}</dd>
            </div>
            {lead.formTitle ? (
              <div>
                <dt className="text-caption text-muted-soft">{t("fields.form")}</dt>
                <dd className="text-body-sm text-ink">{lead.formTitle}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-caption text-muted-soft">{t("fields.captured")}</dt>
              <dd className="text-body-sm text-ink">{formatLeadDate(lead.createdAt, locale)}</dd>
            </div>
            {fields.map((field) =>
              field.value?.trim() ? (
                <div key={field.label}>
                  <dt className="text-caption text-muted-soft">{field.label}</dt>
                  <dd className="whitespace-pre-wrap text-body-sm text-ink">
                    {field.value}
                  </dd>
                </div>
              ) : null,
            )}
          </dl>

          {lead.sessionId ? (
            <Button variant="outline" size="sm" asChild className="rounded-md">
              <Link href={`/dashboard/inbox?session=${lead.sessionId}`}>
                {t("viewConversation")}
              </Link>
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

type LeadsClientProps = {
  initialRows: OrgLeadRow[];
  initialTotal: number;
  agents: SidebarAgentListItem[];
  initialAgentId?: string;
};

export function LeadsClient({
  initialRows,
  initialTotal,
  agents,
  initialAgentId,
}: LeadsClientProps) {
  const t = useTranslations("dashboard.leads");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = React.useState(initialRows);
  const [total, setTotal] = React.useState(initialTotal);
  const [loading, setLoading] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<OrgLeadRow | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const agentId = searchParams.get("agentId") ?? initialAgentId ?? null;
  const captureType = searchParams.get("captureType") as
    | OrgLeadRow["captureType"]
    | null;

  const agentOptions = agents.map((a) => ({ value: a.id, label: a.name }));
  const captureOptions: { value: OrgLeadRow["captureType"]; label: string }[] = [
    { value: "collect_leads", label: t("captureTypes.collectLeads") },
    { value: "custom_form", label: t("captureTypes.customForm") },
  ];

  function updateFilters(next: {
    agentId?: string | null;
    captureType?: OrgLeadRow["captureType"] | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.agentId === undefined) {
      // keep current
    } else if (next.agentId) {
      params.set("agentId", next.agentId);
    } else {
      params.delete("agentId");
    }
    if (next.captureType === undefined) {
      // keep current
    } else if (next.captureType) {
      params.set("captureType", next.captureType);
    } else {
      params.delete("captureType");
    }
    router.replace(`/dashboard/leads?${params.toString()}`);
  }

  React.useEffect(() => {
    setLoading(true);
    void listOrgLeads({
      ...(agentId ? { agentId } : {}),
      ...(captureType ? { captureType } : {}),
      limit: 50,
      offset: 0,
    }).then((result) => {
      setLoading(false);
      if (result.success) {
        setRows(result.data.rows);
        setTotal(result.data.total);
      }
    });
  }, [agentId, captureType]);

  function openDetail(lead: OrgLeadRow) {
    setSelectedLead(lead);
    setDetailOpen(true);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-hairline bg-surface-card px-6 py-5">
        <h1 className="font-display text-display-md text-ink">{t("title")}</h1>
        <p className="mt-1 text-body-sm text-muted">
          {t("description")}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FilterChip
            label={t("fields.agent")}
            options={agentOptions}
            value={agentId}
            onChange={(value) => updateFilters({ agentId: value })}
          />
          <FilterChip
            label={t("fields.source")}
            options={captureOptions}
            value={captureType}
            onChange={(value) =>
              updateFilters({
                captureType: value as OrgLeadRow["captureType"] | null,
              })
            }
          />
          {(agentId || captureType) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-body-sm text-muted"
              onClick={() => updateFilters({ agentId: null, captureType: null })}
            >
              {t("clearFilters")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <p className="text-body-sm text-muted">{t("loading")}</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-hairline bg-surface-card px-6 py-12 text-center">
            <p className="text-body-sm text-muted">{t("empty.title")}</p>
            <p className="mt-1 text-caption text-muted-soft">
              {t("empty.description")}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-caption text-muted-soft">
              {t("count", { count: total })}
            </p>
            <div className="overflow-hidden rounded-xl border border-hairline bg-surface-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-hairline hover:bg-transparent">
                    <TableHead className="text-caption text-muted-soft">{t("fields.contact")}</TableHead>
                    <TableHead className="text-caption text-muted-soft">{t("fields.agent")}</TableHead>
                    <TableHead className="text-caption text-muted-soft">{t("fields.source")}</TableHead>
                    <TableHead className="text-caption text-muted-soft">{t("fields.channel")}</TableHead>
                    <TableHead className="text-caption text-muted-soft">{t("fields.captured")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((lead) => (
                    <TableRow
                      key={`${lead.captureType}-${lead.id}`}
                      className="cursor-pointer border-hairline hover:bg-canvas-soft"
                      onClick={() => openDetail(lead)}
                    >
                      <TableCell>
                        <div>
                          <p className="text-body-sm font-medium text-ink">{lead.label}</p>
                          {lead.email && lead.label !== lead.email ? (
                            <p className="text-caption text-muted">{lead.email}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-body-sm text-body">{lead.agentName}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-caption font-medium ring-1 ring-inset",
                            CAPTURE_TYPE_PILLS[lead.captureType],
                          )}
                        >
                          {t(CAPTURE_TYPE_LABEL_KEYS[lead.captureType])}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lead.channel && CHANNEL_META[lead.channel] ? (
                          <Image
                            src={CHANNEL_META[lead.channel].src}
                            alt={t(CHANNEL_META[lead.channel].labelKey)}
                            title={t(CHANNEL_META[lead.channel].labelKey)}
                            width={16}
                            height={16}
                          />
                        ) : (
                          <span className="text-caption text-muted-soft">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-body-sm text-muted">
                        {formatLeadDate(lead.createdAt, locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <LeadDetailSheet
        lead={selectedLead}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
