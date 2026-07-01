"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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

const CHANNEL_META: Record<string, { src: string; label: string }> = {
  VOICE: { src: "/svg/call.svg", label: "Voice" },
  CHAT: { src: "/svg/chat.svg", label: "Chat" },
  SMS: { src: "/svg/send.svg", label: "SMS" },
  WHATSAPP: { src: "/svg/whatsapp-icon.svg", label: "WhatsApp" },
  EMAIL: { src: "/svg/gmail.svg", label: "Email" },
};

const CAPTURE_TYPE_LABELS: Record<OrgLeadRow["captureType"], string> = {
  collect_leads: "Collect leads",
  custom_form: "Custom form",
};

const CAPTURE_TYPE_PILLS: Record<OrgLeadRow["captureType"], string> = {
  collect_leads: "bg-sky-50 text-sky-700 ring-sky-100",
  custom_form: "bg-violet-50 text-violet-700 ring-violet-100",
};

const CHIP_TRIGGER =
  "h-8 shrink-0 rounded-md border border-hairline bg-surface-card px-2.5 text-xs font-medium shadow-none transition-colors";

function formatLeadDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
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
  if (!lead) return null;

  const fields: { label: string; value: string | null }[] =
    lead.captureType === "collect_leads"
      ? [
          { label: "Name", value: lead.name },
          { label: "Email", value: lead.email },
          { label: "Phone", value: lead.phone },
          { label: "Company", value: lead.company },
          { label: "Notes", value: lead.notes },
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
              {CAPTURE_TYPE_LABELS[lead.captureType]}
            </span>
            {lead.channel && CHANNEL_META[lead.channel] ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-strong px-2 py-0.5 text-caption text-muted">
                <Image
                  src={CHANNEL_META[lead.channel].src}
                  alt=""
                  width={12}
                  height={12}
                />
                {CHANNEL_META[lead.channel].label}
              </span>
            ) : null}
          </div>

          <dl className="space-y-3">
            <div>
              <dt className="text-caption text-muted-soft">Agent</dt>
              <dd className="text-body-sm text-ink">{lead.agentName}</dd>
            </div>
            {lead.formTitle ? (
              <div>
                <dt className="text-caption text-muted-soft">Form</dt>
                <dd className="text-body-sm text-ink">{lead.formTitle}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-caption text-muted-soft">Captured</dt>
              <dd className="text-body-sm text-ink">{formatLeadDate(lead.createdAt)}</dd>
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
                View conversation
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
    { value: "collect_leads", label: "Collect leads" },
    { value: "custom_form", label: "Custom form" },
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
        <h1 className="font-display text-display-md text-ink">Leads</h1>
        <p className="mt-1 text-body-sm text-muted">
          Contact details captured by your agents — conversational leads and custom
          form submissions.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FilterChip
            label="Agent"
            options={agentOptions}
            value={agentId}
            onChange={(value) => updateFilters({ agentId: value })}
          />
          <FilterChip
            label="Source"
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
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <p className="text-body-sm text-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-hairline bg-surface-card px-6 py-12 text-center">
            <p className="text-body-sm text-muted">No leads captured yet.</p>
            <p className="mt-1 text-caption text-muted-soft">
              Enable Collect leads or Custom form on an agent to start capturing
              contact details.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-caption text-muted-soft">
              {total} lead{total === 1 ? "" : "s"}
            </p>
            <div className="overflow-hidden rounded-xl border border-hairline bg-surface-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-hairline hover:bg-transparent">
                    <TableHead className="text-caption text-muted-soft">Contact</TableHead>
                    <TableHead className="text-caption text-muted-soft">Agent</TableHead>
                    <TableHead className="text-caption text-muted-soft">Source</TableHead>
                    <TableHead className="text-caption text-muted-soft">Channel</TableHead>
                    <TableHead className="text-caption text-muted-soft">Captured</TableHead>
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
                          {CAPTURE_TYPE_LABELS[lead.captureType]}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lead.channel && CHANNEL_META[lead.channel] ? (
                          <Image
                            src={CHANNEL_META[lead.channel].src}
                            alt={CHANNEL_META[lead.channel].label}
                            title={CHANNEL_META[lead.channel].label}
                            width={16}
                            height={16}
                          />
                        ) : (
                          <span className="text-caption text-muted-soft">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-body-sm text-muted">
                        {formatLeadDate(lead.createdAt)}
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
