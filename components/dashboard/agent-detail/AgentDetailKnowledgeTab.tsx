"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Globe,
  Library,
  Loader2,
  MoreHorizontal,
  Search,
  Type,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import type { KnowledgeSourceKind } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatStorageBytes } from "@/lib/knowledge/format-bytes";
import { KnowledgeIcon } from "@/components/ui/icons";
import {
  createKnowledgeFromUrl,
  createKnowledgeText,
  uploadKnowledgeFiles,
} from "@/lib/actions/knowledge";
import {
  attachKnowledgeDocToAgent,
  detachKnowledgeDocFromAgent,
  getAgentKnowledgeDocs,
  getOrgKnowledgeDocs,
} from "@/lib/actions/agents";

type TypeFilter = "all" | KnowledgeSourceKind;

type AttachedDocRow = {
  id: string;
  title: string;
  sourceKind: KnowledgeSourceKind;
  creatorEmail: string;
  updatedAt: string;
  sizeBytes: number;
};

type OrgDocRow = {
  id: string;
  title: string;
  sourceKind: KnowledgeSourceKind;
  creatorEmail: string;
  sizeBytes: number;
};

/** Modal primary CTA — ink surface per ElevenLabs-style KB references */
const kbModalPrimaryClass =
  "h-9 rounded-md bg-ink px-4 text-body-sm font-medium text-on-primary shadow-none hover:bg-body-strong disabled:opacity-50";

function formatRowDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function sourceIcon(kind: KnowledgeSourceKind) {
  if (kind === "URL") return <Globe className="h-5 w-5 text-ink" aria-hidden />;
  if (kind === "FILE") return <FileText className="h-5 w-5 text-ink" aria-hidden />;
  return <Type className="h-5 w-5 text-ink" aria-hidden />;
}

function DocRowActions({
  agentId,
  docId,
  onDetached,
}: {
  agentId: string;
  docId: string;
  onDetached: () => void;
}) {
  async function handleDetach() {
    const res = await detachKnowledgeDocFromAgent(agentId, docId);
    if (res.success) {
      toast.success("Document detached");
      onDetached();
    } else {
      toast.error(res.error ?? "Detach failed");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Document actions"
          className="h-8 w-8 text-muted transition-all hover:bg-surface-strong hover:text-ink"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[10rem] rounded-xl border-hairline bg-surface-card"
      >
        <DropdownMenuItem
          onClick={handleDetach}
          className="text-semantic-error focus:text-semantic-error"
        >
          Detach document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModalHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="shrink-0 text-ink">{icon}</span>
      <h2 className="text-title-md font-medium text-ink">{title}</h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create dialogs (reuse logic from KnowledgeBaseClient)              */
/* ------------------------------------------------------------------ */

function UrlDialog({
  open,
  onOpenChange,
  onSuccessDocIds,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccessDocIds: (docIds: string[]) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [url, setUrl] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setUrl("");
      setBusy(false);
    }
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const title = url.replace(/^https?:\/\//, "").split("/")[0] || url;
      const res = await createKnowledgeFromUrl({ title, url, mode: "single" });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("URL added");
      const ids = ("docIds" in res && Array.isArray(res.docIds) ? res.docIds : []).filter(
        (x): x is string => typeof x === "string" && x.length > 0,
      );
      onOpenChange(false);
      if (ids.length > 0) onSuccessDocIds(ids);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-xl border-hairline bg-surface-card p-4 shadow-md sm:max-w-[480px]">
        <ModalHeader icon={<Globe className="h-5 w-5" aria-hidden />} title="Add URL" />
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="agent-kb-url" className="text-body-sm font-medium text-body-strong">
              URL
            </Label>
            <Input
              id="agent-kb-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>
          <div className="border-t border-hairline pt-3">
            <div className="flex justify-end">
              <Button type="submit" disabled={busy || !url} className={kbModalPrimaryClass}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Fetching…" : "Add URL"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FilesDialog({
  open,
  onOpenChange,
  onSuccessDocIds,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccessDocIds: (docIds: string[]) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [drag, setDrag] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setFiles([]);
      setDrag(false);
      setBusy(false);
    }
  }, [open]);

  function addFiles(list: File[]) {
    setFiles((prev) => [...prev, ...list]);
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      toast.error("Add at least one file");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const res = await uploadKnowledgeFiles(fd);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Files uploaded");
      const ids = ("docIds" in res && Array.isArray(res.docIds) ? res.docIds : []).filter(
        (x): x is string => typeof x === "string" && x.length > 0,
      );
      onOpenChange(false);
      if (ids.length > 0) onSuccessDocIds(ids);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-xl border-hairline bg-surface-card p-4 shadow-md sm:max-w-[480px]">
        <ModalHeader icon={<Upload className="h-5 w-5" aria-hidden />} title="Add Files" />
        <form onSubmit={onSubmit} className="space-y-4">
          <div
            role="presentation"
            onDragEnter={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              addFiles(Array.from(e.dataTransfer.files));
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-hairline-strong bg-canvas-soft/50 p-4 text-center transition-colors",
              drag
                ? "border-ink/25 bg-surface-strong"
                : "hover:border-hairline-strong hover:bg-canvas-soft",
            )}
          >
            <Upload className="mb-3 h-8 w-8 text-muted" aria-hidden />
            <p className="text-body-sm text-body">Drag and drop files here</p>
            <p className="mt-1 text-caption text-muted">
              or{" "}
              <span className="font-medium text-ink underline underline-offset-2">
                browse
              </span>{" "}
              from your computer
            </p>
            <p className="mt-2 text-caption text-muted-soft">Supported formats: PDF, DOCX, TXT</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const list = e.target.files;
                if (list?.length) addFiles(Array.from(list));
              }}
            />
          </div>

          {files.length > 0 && (
            <ul className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-hairline bg-surface-card p-2">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${f.size}-${i}`}
                  className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">
                    {f.name}
                  </span>
                  <span className="shrink-0 text-caption text-muted">
                    {formatStorageBytes(f.size)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="h-6 w-6 shrink-0 rounded-md text-muted-soft opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                    aria-label={`Remove ${f.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-hairline pt-3">
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={busy || !files.length}
                className={kbModalPrimaryClass}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Uploading…" : `Upload${files.length ? ` (${files.length})` : ""}`}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TextDialog({
  open,
  onOpenChange,
  onSuccessDocIds,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccessDocIds: (docIds: string[]) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setTitle("");
      setContent("");
      setBusy(false);
    }
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createKnowledgeText({ title, content });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Text document created");
      const ids = ("docId" in res && typeof res.docId === "string" ? [res.docId] : []).filter(
        (x): x is string => typeof x === "string" && x.length > 0,
      );
      onOpenChange(false);
      if (ids.length > 0) onSuccessDocIds(ids);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-xl border-hairline bg-surface-card p-4 shadow-md sm:max-w-[520px]">
        <ModalHeader icon={<Type className="h-5 w-5" aria-hidden />} title="Create Text" />
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="agent-kb-text-title" className="text-body-sm font-medium text-body-strong">
              Document title
            </Label>
            <Input
              id="agent-kb-text-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agent-kb-text-content" className="text-body-sm font-medium text-body-strong">
              Content
            </Label>
            <Textarea
              id="agent-kb-text-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              placeholder="Write or paste your knowledge text here…"
              className="min-h-[160px] resize-y rounded-xl border-hairline bg-surface-card text-body-sm placeholder:text-muted-soft focus-visible:border-hairline-strong focus-visible:ring-1 focus-visible:ring-ink/10"
            />
          </div>
          <div className="border-t border-hairline pt-3">
            <div className="flex justify-end">
              <Button type="submit" disabled={busy} className={kbModalPrimaryClass}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Saving…" : "Save Document"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared "Add document" dropdown content                             */
/* ------------------------------------------------------------------ */

function AddDocumentMenuContent({
  orgDocsBusy,
  orgDocs,
  onSelectOrgDoc,
  onAddUrl,
  onAddFiles,
  onAddText,
  align = "end",
}: {
  orgDocsBusy: boolean;
  orgDocs: OrgDocRow[];
  onSelectOrgDoc: (docId: string) => void;
  onAddUrl: () => void;
  onAddFiles: () => void;
  onAddText: () => void;
  align?: "start" | "center" | "end";
}) {
  const searchRef = React.useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | KnowledgeSourceKind>("all");
  const [creatorFilter, setCreatorFilter] = React.useState<string>("all");

  React.useEffect(() => {
    const timer = setTimeout(() => searchRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const creators = React.useMemo(() => {
    const set = new Set<string>();
    for (const d of orgDocs) {
      if (d.creatorEmail && d.creatorEmail !== "—") set.add(d.creatorEmail);
    }
    return Array.from(set).sort();
  }, [orgDocs]);

  const displayDocs = React.useMemo(() => {
    let out = orgDocs;
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((d) => d.title.toLowerCase().includes(q));
    if (typeFilter !== "all") out = out.filter((d) => d.sourceKind === typeFilter);
    if (creatorFilter !== "all") out = out.filter((d) => d.creatorEmail === creatorFilter);
    return out.slice(0, 3);
  }, [orgDocs, query, typeFilter, creatorFilter]);

  return (
    <DropdownMenuContent
      align={align}
      className="w-[400px] overflow-hidden rounded-md border-hairline bg-surface-card py-1 px-1.5 shadow-md"
    >
      {/* Borderless search textarea */}
      <div className="px-0.5 pt-0.5 mb-1">
        <Textarea
          ref={searchRef}
          autoFocus
          placeholder="Search documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={1}
          className="min-h-0 resize-none border-0 bg-transparent p-0 text-body-md placeholder:text-muted-soft shadow-none focus-visible:ring-0 focus-visible:border-0"
        />
      </div>

      {/* +Type / +Creator filter tags */}
      <div className="flex items-center gap-2 px-0.5 pb-1.5 pt-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 rounded-md border-hairline bg-surface-card px-2 text-[12px] font-medium text-body shadow-none hover:bg-canvas-soft"
            >
              + Type
              {typeFilter !== "all" ? ` (${typeFilter})` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[10rem] rounded-xl border-hairline bg-surface-card">
            <DropdownMenuItem onClick={() => setTypeFilter("all")}>All types</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("URL")}>URL</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("FILE")}>File</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("TEXT")}>Text</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 rounded-md border-hairline bg-surface-card px-2 text-[12px] font-medium text-body shadow-none hover:bg-canvas-soft"
            >
              + Creator
              {creatorFilter !== "all" ? ` (${creatorFilter})` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[12rem] rounded-xl border-hairline bg-surface-card">
            <DropdownMenuItem onClick={() => setCreatorFilter("all")}>
              All creators
            </DropdownMenuItem>
            {creators.length === 0 ? (
              <DropdownMenuItem disabled>No creators</DropdownMenuItem>
            ) : (
              creators.map((c) => (
                <DropdownMenuItem key={c} onClick={() => setCreatorFilter(c)}>
                  {c}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Muted separator */}
      <div className="border-t border-hairline mx-0.5" />

      {/* Document list (top 3) */}
      <div className="px-0.5 py-1">
        {orgDocsBusy ? (
          <div className="flex items-center justify-center py-6 text-body-sm text-muted">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : displayDocs.length === 0 ? (
          <div className="py-4 text-center text-body-sm text-muted">
            No documents found.
          </div>
        ) : (
          <div className="space-y-0.5">
            {displayDocs.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => void onSelectOrgDoc(d.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-surface-strong"
              >
                <span className="shrink-0 text-ink">
                  {d.sourceKind === "URL" ? (
                    <Globe className="h-5 w-5" aria-hidden />
                  ) : d.sourceKind === "FILE" ? (
                    <FileText className="h-5 w-5" aria-hidden />
                  ) : (
                    <Type className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-ink">{d.title}</div>
                  <div className="truncate text-[12px] text-muted">{formatStorageBytes(d.sizeBytes)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Muted separator */}
      <div className="border-t border-hairline mx-0.5" />

      {/* Bottom action buttons */}
      <div className="flex items-center gap-2 px-0.5 pb-0.5 pt-1.5">
        <DropdownMenuTrigger asChild />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 flex-1 justify-center rounded-md border-hairline bg-surface-card px-2 text-[13px] font-medium text-body shadow-none hover:bg-canvas-soft"
          onClick={onAddUrl}
        >
          <Globe className="mr-2 h-4 w-4 text-muted" aria-hidden />
          Add URL
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 flex-1 justify-center rounded-md border-hairline bg-surface-card px-2 text-[13px] font-medium text-body shadow-none hover:bg-canvas-soft"
          onClick={onAddFiles}
        >
          <Upload className="mr-2 h-4 w-4 text-muted" aria-hidden />
          Add Files
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 flex-1 justify-center rounded-md border-hairline bg-surface-card px-2 text-[13px] font-medium text-body shadow-none hover:bg-canvas-soft"
          onClick={onAddText}
        >
          <Type className="mr-2 h-4 w-4 text-muted" aria-hidden />
          Create Text
        </Button>
      </div>
    </DropdownMenuContent>
  );
}

/* ------------------------------------------------------------------ */
/*  Main tab                                                           */
/* ------------------------------------------------------------------ */

export function AgentDetailKnowledgeTab({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();

  const [busy, setBusy] = React.useState(true);
  const [rows, setRows] = React.useState<AttachedDocRow[]>([]);

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
  const [creatorFilter, setCreatorFilter] = React.useState<string>("all");

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [bottomMenuOpen, setBottomMenuOpen] = React.useState(false);
  const [orgDocsBusy, setOrgDocsBusy] = React.useState(false);
  const [orgDocs, setOrgDocs] = React.useState<OrgDocRow[]>([]);

  const [openUrl, setOpenUrl] = React.useState(false);
  const [openFiles, setOpenFiles] = React.useState(false);
  const [openText, setOpenText] = React.useState(false);

  const refresh = React.useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const res = await getAgentKnowledgeDocs(agentId);
      if (res.success) {
        setRows(res.data.rows);
      } else {
        toast.error(res.error ?? "Failed to load attached documents");
      }
    } finally {
      setBusy(false);
    }
  }, [agentId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const creators = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.creatorEmail && r.creatorEmail !== "—") set.add(r.creatorEmail);
    }
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    let out = rows;
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") {
      out = out.filter((r) => r.sourceKind === typeFilter);
    }
    if (creatorFilter !== "all") {
      out = out.filter((r) => r.creatorEmail === creatorFilter);
    }
    return out;
  }, [rows, search, typeFilter, creatorFilter]);

  async function ensureOrgDocsLoaded() {
    if (orgDocsBusy || orgDocs.length > 0) return;
    setOrgDocsBusy(true);
    try {
      const res = await getOrgKnowledgeDocs();
      if (res.success) setOrgDocs(res.data);
      else toast.error(res.error ?? "Failed to load knowledge documents");
    } finally {
      setOrgDocsBusy(false);
    }
  }

  async function attachIds(ids: string[]) {
    for (const id of ids) {
      const res = await attachKnowledgeDocToAgent(agentId, id);
      if (!res.success) {
        toast.error(res.error ?? "Attach failed");
        return;
      }
    }
    await load();
    refresh();
  }

  async function onSelectOrgDoc(docId: string, closeMenu: () => void) {
    const res = await attachKnowledgeDocToAgent(agentId, docId);
    if (res.success) {
      toast.success("Document attached");
      closeMenu();
      await load();
      refresh();
    } else {
      toast.error(res.error ?? "Attach failed");
    }
  }

  return (
    <div className="mx-auto max-w-6xl flex flex-col gap-2 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
            Agent Knowledge Base
          </h1>
          <KnowledgeIcon className="h-4 w-4 text-muted" aria-hidden />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-md border-hairline bg-surface-card px-3 text-body-sm font-medium text-body shadow-none hover:bg-canvas-soft"
            onClick={() => toast.message("Coming soon")}
          >
            Configure RAG
          </Button>

          <DropdownMenu
            open={menuOpen}
            onOpenChange={(o) => {
              setMenuOpen(o);
              if (o) void ensureOrgDocsLoaded();
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="primary" className="h-8">
                Add document
              </Button>
            </DropdownMenuTrigger>
            <AddDocumentMenuContent
              orgDocsBusy={orgDocsBusy}
              orgDocs={orgDocs}
              onSelectOrgDoc={(id) => void onSelectOrgDoc(id, () => setMenuOpen(false))}
              onAddUrl={() => { setMenuOpen(false); setOpenUrl(true); }}
              onAddFiles={() => { setMenuOpen(false); setOpenFiles(true); }}
              onAddText={() => { setMenuOpen(false); setOpenText(true); }}
            />
          </DropdownMenu>
        </div>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          placeholder="Search Knowledge Base..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-md border-hairline bg-surface-card pl-9 text-body-sm text-ink placeholder:text-muted-soft focus-visible:border-hairline-strong focus-visible:ring-1 focus-visible:ring-ink/10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 rounded-md border-hairline bg-surface-card py-1 px-2 text-body-sm font-medium text-body shadow-none hover:bg-canvas-soft"
            >
              + Type
              {typeFilter !== "all" ? ` (${typeFilter})` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-[10rem] rounded-xl border-hairline bg-surface-card"
          >
            <DropdownMenuItem onClick={() => setTypeFilter("all")}>All types</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("URL")}>URL</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("FILE")}>File</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("TEXT")}>Text</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 rounded-md border-hairline bg-surface-card py-1 px-2 text-body-sm font-medium text-body shadow-none hover:bg-canvas-soft"
            >
              + Creator
              {creatorFilter !== "all" ? ` (${creatorFilter})` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-[12rem] rounded-xl border-hairline bg-surface-card"
          >
            <DropdownMenuItem onClick={() => setCreatorFilter("all")}>
              All creators
            </DropdownMenuItem>
            {creators.map((c) => (
              <DropdownMenuItem key={c} onClick={() => setCreatorFilter(c)}>
                {c}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-xl bg-surface-card">
        {busy ? (
          <div className="flex items-center justify-center py-20 text-body-sm text-muted">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-hairline bg-surface-card">
              <Library className="h-6 w-6 text-ink" aria-hidden />
            </div>
            <h3 className="text-base font-semibold text-ink">No documents found</h3>
            <p className="mt-1 max-w-sm text-body-sm text-muted">
              This agent has no attached documents yet.
            </p>
            <div className="mt-4">
              <DropdownMenu
                open={bottomMenuOpen}
                onOpenChange={(o) => {
                  setBottomMenuOpen(o);
                  if (o) void ensureOrgDocsLoaded();
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="primary">
                    Add document
                  </Button>
                </DropdownMenuTrigger>
                <AddDocumentMenuContent
                  align="center"
                  orgDocsBusy={orgDocsBusy}
                  orgDocs={orgDocs}
                  onSelectOrgDoc={(id) => void onSelectOrgDoc(id, () => setBottomMenuOpen(false))}
                  onAddUrl={() => { setBottomMenuOpen(false); setOpenUrl(true); }}
                  onAddFiles={() => { setBottomMenuOpen(false); setOpenFiles(true); }}
                  onAddText={() => { setBottomMenuOpen(false); setOpenText(true); }}
                />
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-0 text-xs font-medium uppercase tracking-wider text-muted">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted">
                    Created by
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted">
                    Last updated
                  </TableHead>
                  <TableHead className="w-[44px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="border-0 transition-colors duration-200 hover:bg-surface-strong/40"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <TableCell className="py-1 pl-0">
                    <div className="flex items-center gap-2">
                      {sourceIcon(row.sourceKind)}
                      <div className="min-w-0">
                        <div className="truncate text-body-sm font-medium text-ink">
                          {row.title}
                        </div>
                        <div className="text-caption text-muted">
                          {formatStorageBytes(row.sizeBytes)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-body-sm text-muted">
                    {row.creatorEmail}
                  </TableCell>
                  <TableCell className="py-1 text-right text-caption text-muted">
                    {formatRowDate(row.updatedAt)}
                  </TableCell>
                  <TableCell className="py-1 text-right">
                    <DocRowActions
                      agentId={agentId}
                      docId={row.id}
                      onDetached={async () => {
                        await load();
                        refresh();
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <UrlDialog
        open={openUrl}
        onOpenChange={setOpenUrl}
        onSuccessDocIds={(ids) => void attachIds(ids)}
      />
      <FilesDialog
        open={openFiles}
        onOpenChange={setOpenFiles}
        onSuccessDocIds={(ids) => void attachIds(ids)}
      />
      <TextDialog
        open={openText}
        onOpenChange={setOpenText}
        onSuccessDocIds={(ids) => void attachIds(ids)}
      />
    </div>
  );
}

