"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Library,
    Globe,
    Loader2,
    Search,
    Type,
    Upload,
    FolderPlus,
    FileText,
    FolderOpen,
    Folder,
    MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import type {
    KnowledgeDashboardPayload,
    KnowledgeRow,
} from "@/lib/actions/knowledge";
import {
    createKnowledgeFolder,
    createKnowledgeFromUrl,
    createKnowledgeText,
    deleteKnowledgeDoc,
    uploadKnowledgeFiles,
} from "@/lib/actions/knowledge";
import { formatStorageBytes } from "@/lib/knowledge/format-bytes";
import { KnowledgeIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Modal primary CTA — ink surface per ElevenLabs-style KB references */
const kbModalPrimaryClass =
    "h-9 rounded-md bg-ink px-4 text-body-sm font-medium text-on-primary shadow-none hover:bg-body-strong disabled:opacity-50";

type TypeFilter = "all" | "folder" | "URL" | "FILE" | "TEXT";

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

function DocActionsSelect({
    docId,
    onDeleteSuccess,
}: {
    docId: string;
    onDeleteSuccess: () => void;
}) {
    async function handleCopyId() {
        try {
            await navigator.clipboard.writeText(docId);
            toast.success("Document ID copied");
        } catch {
            toast.error("Failed to copy");
        }
    }

    function handleShare() {
        toast.message("Coming soon");
    }

    async function handleDelete() {
        const res = await deleteKnowledgeDoc(docId);
        if (res.success) {
            toast.success("Document deleted");
            onDeleteSuccess();
        } else {
            toast.error(res.error ?? "Delete failed");
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Document actions"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent bg-transparent p-0 shadow-none hover:bg-canvas-soft focus-visible:ring-2 focus-visible:ring-ink/10"
                >
                    <MoreHorizontal className="h-5 w-5 text-muted" aria-hidden />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem] rounded-xl border-hairline">
                <DropdownMenuItem onClick={handleCopyId}>
                    Copy document ID
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                    Share document
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-semantic-error focus:text-semantic-error"
                >
                    Delete document
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/* ------------------------------------------------------------------ */
/*  Main client component                                              */
/* ------------------------------------------------------------------ */

export function KnowledgeBaseClient({
    initial,
}: {
    initial: KnowledgeDashboardPayload;
}) {
    const router = useRouter();
    const [, startTransition] = React.useTransition();

    const [openUrl, setOpenUrl] = React.useState(false);
    const [openFiles, setOpenFiles] = React.useState(false);
    const [openText, setOpenText] = React.useState(false);
    const [openFolder, setOpenFolder] = React.useState(false);

    const [search, setSearch] = React.useState("");
    const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
    const [creatorFilter, setCreatorFilter] = React.useState<string>("all");
    const [selectedDocIds, setSelectedDocIds] = React.useState<Set<string>>(
        () => new Set(),
    );

    const creators = React.useMemo(() => {
        const set = new Set<string>();
        for (const row of initial.rows) {
            if (row.kind === "document" && row.creatorEmail !== "—") {
                set.add(row.creatorEmail);
            }
        }
        return Array.from(set).sort();
    }, [initial.rows]);

    const filteredRows = React.useMemo(() => {
        let rows = initial.rows;
        const q = search.trim().toLowerCase();
        if (q) {
            rows = rows.filter((row) => {
                if (row.kind === "folder") return row.name.toLowerCase().includes(q);
                return row.title.toLowerCase().includes(q);
            });
        }
        if (typeFilter !== "all") {
            if (typeFilter === "folder") {
                rows = rows.filter((r) => r.kind === "folder");
            } else {
                rows = rows.filter(
                    (r) => r.kind === "document" && r.sourceKind === typeFilter,
                );
            }
        }
        if (creatorFilter !== "all") {
            rows = rows.filter(
                (r) => (r.kind === "folder" ? false : r.creatorEmail === creatorFilter),
            );
        }
        return rows;
    }, [initial.rows, search, typeFilter, creatorFilter]);

    const visibleDocIds = React.useMemo(() => {
        return filteredRows
            .filter((r): r is Extract<KnowledgeRow, { kind: "document" }> => r.kind === "document")
            .map((d) => d.id);
    }, [filteredRows]);

    const allVisibleSelected =
        visibleDocIds.length > 0 && visibleDocIds.every((id) => selectedDocIds.has(id));
    const someVisibleSelected = visibleDocIds.some((id) => selectedDocIds.has(id));

    const toggleAllVisible = React.useCallback(
        (checked: boolean) => {
            setSelectedDocIds((prev) => {
                const next = new Set(prev);
                if (checked) {
                    for (const id of visibleDocIds) next.add(id);
                } else {
                    for (const id of visibleDocIds) next.delete(id);
                }
                return next;
            });
        },
        [visibleDocIds],
    );

    const refresh = React.useCallback(() => {
        startTransition(() => {
            router.refresh();
        });
    }, [router]);

    const usedStr = formatStorageBytes(initial.storageUsedBytes);
    const quotaStr = formatStorageBytes(initial.quotaBytes);

    return (
        <div className="mx-auto max-w-6xl flex flex-col gap-2 py-4">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
                        Knowledge Base
                    </h1>
                    <KnowledgeIcon className="h-4 w-4 text-muted" aria-hidden />
                </div>
                <div
                    className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-surface-card px-3 py-1 text-caption text-body"
                    title="Indexed source storage for this workspace"
                >
                    <span
                        className="h-2 w-2 shrink-0 rounded-full bg-semantic-success"
                        aria-hidden
                    />
                    <span className="text-muted">RAG Storage:</span>
                    <span className="font-semibold text-ink">{usedStr}</span>
                    <span className="text-muted">/</span>
                    <span className="text-body">{quotaStr}</span>
                </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 max-w-xl">
                <ActionCard
                    icon={<Globe className="h-5 w-5 text-ink" />}
                    label="Add URL"
                    onClick={() => setOpenUrl(true)}
                />
                <ActionCard
                    icon={<FileText className="h-5 w-5 text-ink" />}
                    label="Add Files"
                    onClick={() => setOpenFiles(true)}
                />
                <ActionCard
                    icon={<Type className="h-5 w-5 text-ink" />}
                    label="Create Text"
                    onClick={() => setOpenText(true)}
                />
                <ActionCard
                    icon={<FolderPlus className="h-5 w-5 text-ink" />}
                    label="Create Folder"
                    onClick={() => setOpenFolder(true)}
                />
            </div>

            {/* Search */}
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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-md border-hairline bg-surface-card py-1 px-2 text-body-sm font-medium text-body shadow-none hover:bg-canvas-soft"
                        >
                            + Type
                            {typeFilter !== "all" ? ` (${typeFilter})` : ""}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[10rem] rounded-xl border-hairline">
                        <DropdownMenuItem onClick={() => setTypeFilter("all")}>
                            All types
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter("folder")}>
                            Folder
                        </DropdownMenuItem>
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
                            className="h-8 rounded-md border-hairline bg-surface-card py-1 px-2 text-body-sm font-medium text-body shadow-none hover:bg-canvas-soft"
                        >
                            + Creator
                            {creatorFilter !== "all" ? ` (${creatorFilter})` : ""}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[12rem] rounded-xl border-hairline">
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

            {/* Table / empty */}
            {filteredRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-hairline bg-surface-card py-16 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-hairline bg-surface-card">
                        <Library className="h-6 w-6 text-ink" aria-hidden />
                    </div>
                    <h3 className="text-base font-semibold text-ink">No documents found</h3>
                    <p className="mt-1 max-w-sm text-body-sm text-muted">
                        You don&apos;t have any documents yet.
                    </p>
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow className="border-b border-hairline hover:bg-transparent">
                        <TableHead className="w-[36px] px-3 py-2">
                            <Checkbox
                                aria-label="Select all documents"
                                className="data-[state=checked]:bg-ink data-[state=checked]:border-ink data-[state=checked]:text-white"
                                checked={
                                    allVisibleSelected
                                        ? true
                                        : someVisibleSelected
                                          ? "indeterminate"
                                          : false
                                }
                                onCheckedChange={(v) =>
                                    toggleAllVisible(Boolean(v === true))
                                }
                            />
                        </TableHead>
                        <TableHead className="px-3 py-2 text-body-sm font-medium text-muted">
                            Name
                        </TableHead>
                        <TableHead className="px-3 py-2 text-body-sm font-medium text-muted">
                            Created by
                        </TableHead>
                        <TableHead className="px-3 py-2 text-right text-body-sm font-medium text-muted">
                            Last updated
                        </TableHead>
                        <TableHead className="w-[44px] px-3 py-2" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredRows.map((row) =>
                        row.kind === "folder" ? (
                            <TableRow
                                key={`f-${row.id}`}
                                className="border-b border-hairline last:border-0 hover:bg-transparent"
                            >
                                <TableCell className="px-3 py-2" />
                                <TableCell className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <FolderOpen className="h-5 w-5 text-ink" aria-hidden />
                                        <span className="text-body-sm font-medium text-ink">{row.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-3 py-2 text-body-sm text-muted">
                                    —
                                </TableCell>
                                <TableCell className="px-3 py-2 text-right text-caption text-muted">
                                    {formatRowDate(row.updatedAt)}
                                </TableCell>
                                <TableCell className="px-3 py-2" />
                            </TableRow>
                        ) : (
                            <TableRow
                                key={`d-${row.id}`}
                                className="border-b border-hairline last:border-0 hover:bg-transparent"
                            >
                                <TableCell className="px-3 py-2">
                                    <Checkbox
                                        aria-label={`Select ${row.title}`}
                                        className="data-[state=checked]:bg-ink data-[state=checked]:border-ink data-[state=checked]:text-white"
                                        checked={selectedDocIds.has(row.id)}
                                        onCheckedChange={(v) => {
                                            const isChecked = v === true;
                                            setSelectedDocIds((prev) => {
                                                const next = new Set(prev);
                                                if (isChecked) next.add(row.id);
                                                else next.delete(row.id);
                                                return next;
                                            });
                                        }}
                                    />
                                </TableCell>
                                <TableCell className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        {row.sourceKind === "URL" ? (
                                            <Globe className="h-5 w-5 text-ink" aria-hidden />
                                        ) : row.sourceKind === "FILE" ? (
                                            <FileText className="h-5 w-5 text-ink" aria-hidden />
                                        ) : (
                                            <Type className="h-5 w-5 text-ink" aria-hidden />
                                        )}
                                        <div className="min-w-0">
                                            <div className="truncate text-body-sm font-medium text-muted">
                                                {row.title}
                                            </div>
                                            <div className="text-caption text-muted">
                                                {formatStorageBytes(row.sizeBytes)}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="px-3 py-2 text-body-sm text-muted">
                                    {row.creatorEmail}
                                </TableCell>
                                <TableCell className="px-3 py-2 text-right text-caption text-muted">
                                    {formatRowDate(row.updatedAt)}
                                </TableCell>
                                <TableCell className="px-3 py-2 text-right">
                                    <DocActionsSelect docId={row.id} onDeleteSuccess={refresh} />
                                </TableCell>
                            </TableRow>
                        ),
                    )}
                </TableBody>
            </Table>
            )}

            {/* Dialogs */}
            <UrlDialog
                open={openUrl}
                onOpenChange={setOpenUrl}
                folders={initial.folders}
                onSuccess={() => { toast.success("URL added"); refresh(); }}
            />
            <FilesDialog
                open={openFiles}
                onOpenChange={setOpenFiles}
                folders={initial.folders}
                onSuccess={() => { toast.success("Files uploaded"); refresh(); }}
            />
            <TextDialog
                open={openText}
                onOpenChange={setOpenText}
                folders={initial.folders}
                onSuccess={() => { toast.success("Text document created"); refresh(); }}
            />
            <FolderDialog
                open={openFolder}
                onOpenChange={setOpenFolder}
                folders={initial.folders}
                onSuccess={() => { toast.success("Folder created"); refresh(); }}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Action Card                                                        */
/* ------------------------------------------------------------------ */

function ActionCard({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex h-[76px] flex-col justify-between rounded-xl border border-hairline bg-surface-card px-4 py-3 text-left transition-all",
                "hover:border-hairline-strong hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            )}
        >
            <span className="text-ink">{icon}</span>
            <span className="text-body-sm font-normal text-body">{label}</span>
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Folder Select (shadcn Select)                                      */
/* ------------------------------------------------------------------ */

function FolderSelect({
    id,
    value,
    onChange,
    folders,
    rootLabel = "Knowledge Base",
}: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    folders: KnowledgeDashboardPayload["folders"];
    rootLabel?: string;
}) {
    if (folders.length === 0) {
        return (
            <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground">
                <Folder className="size-4 shrink-0 text-muted" aria-hidden />
                <span>{rootLabel}</span>
                <span className="rounded-xs bg-accent px-1.5 py-0.5 text-xs text-muted-foreground">
                    Current
                </span>
            </div>
        );
    }

    const resolved = value === "" ? "__none__" : value;

    return (
        <Select value={resolved} onValueChange={onChange}>
            <SelectTrigger id={id} className="w-full">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Folder className="size-4 shrink-0 text-muted" aria-hidden />
                    <SelectValue placeholder={rootLabel} />
                    {resolved === "__none__" ? (
                        <span className="rounded-xs bg-accent px-1.5 py-0.5 text-xs text-muted-foreground">
                            Current
                        </span>
                    ) : null}
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="__none__">{rootLabel}</SelectItem>
                {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
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
/*  URL Dialog                                                         */
/* ------------------------------------------------------------------ */

type UrlTab = "single" | "sitemap" | "website";

function UrlDialog({
    open,
    onOpenChange,
    folders,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    folders: KnowledgeDashboardPayload["folders"];
    onSuccess: () => void;
}) {
    const [busy, setBusy] = React.useState(false);
    const [tab, setTab] = React.useState<UrlTab>("single");
    const [url, setUrl] = React.useState("");
    const [folderId, setFolderId] = React.useState("__none__");
    const [sitemapPattern, setSitemapPattern] = React.useState("");
    const [websiteDepth, setWebsiteDepth] = React.useState(2);
    const [websiteMaxUrls, setWebsiteMaxUrls] = React.useState(1000);
    const [websitePattern, setWebsitePattern] = React.useState("");

    React.useEffect(() => {
        if (!open) {
            setTab("single");
            setUrl("");
            setFolderId("__none__");
            setSitemapPattern("");
            setWebsiteDepth(2);
            setWebsiteMaxUrls(1000);
            setWebsitePattern("");
            setBusy(false);
        }
    }, [open]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        try {
            const title = url.replace(/^https?:\/\//, "").split("/")[0] || url;
            const res = await createKnowledgeFromUrl({
                title,
                url,
                folderId: folderId !== "__none__" ? folderId : null,
                mode: tab,
                pattern: tab === "sitemap" ? sitemapPattern : tab === "website" ? websitePattern : undefined,
                crawlDepth: tab === "website" ? websiteDepth : undefined,
                maxUrls: tab === "website" ? websiteMaxUrls : undefined,
            });
            if (!res.success) {
                toast.error(res.error);
                return;
            }
            const pages = res.pagesImported;
            if (pages && pages > 1) {
                toast.success(`Imported ${pages} pages`);
                if ("warning" in res && res.warning) {
                    toast.warning(res.warning);
                }
            } else {
                toast.success("URL imported successfully");
            }
            onOpenChange(false);
            onSuccess();
        } finally {
            setBusy(false);
        }
    }

    const segmentIds = React.useMemo(() => ["single", "sitemap", "website"] as const, []);

    const submitLabel = tab === "single" ? "Add URL" : tab === "sitemap" ? "Import Sitemap" : "Crawl Website";

    const busyLabel = busy ? (tab === "single" ? "Fetching…" : "Importing pages…") : submitLabel;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-xl border-hairline bg-surface-card p-4 shadow-md sm:max-w-[480px]">
                <ModalHeader icon={<Globe className="h-5 w-5" aria-hidden />} title="Add URL" />
                <div
                    className="mb-4 inline-flex h-10 items-center rounded-lg bg-surface-strong p-1"
                    role="tablist"
                    aria-label="URL import type"
                >
                    {[
                        { id: "single" as const, label: "Single URL" },
                        { id: "sitemap" as const, label: "Sitemap" },
                        { id: "website" as const, label: "Whole Website" },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={tab === id}
                            tabIndex={tab === id ? 0 : -1}
                            onClick={() => setTab(id)}
                            onKeyDown={(e) => {
                                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                                e.preventDefault();
                                const i = segmentIds.indexOf(id);
                                const next =
                                    e.key === "ArrowRight"
                                        ? segmentIds[(i + 1) % segmentIds.length]
                                        : segmentIds[(i - 1 + segmentIds.length) % segmentIds.length];
                                setTab(next);
                            }}
                            className={cn(
                                "flex-1 rounded-md px-3 py-0.5 text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
                                tab === id
                                    ? "bg-surface-card text-ink shadow-sm"
                                    : "text-muted hover:text-body-strong",
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="kb-url-folder" className="text-body-sm font-medium text-body-strong">
                            Parent folder
                        </Label>
                        <FolderSelect
                            id="kb-url-folder"
                            value={folderId}
                            onChange={setFolderId}
                            folders={folders}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="kb-url-field" className="text-body-sm font-medium text-body-strong">
                            URL
                        </Label>
                        <Input
                            id="kb-url-field"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                        />
                        {tab === "sitemap" && (
                            <p className="text-caption text-muted">
                                Get the sitemap for this URL and decide what pages to crawl. Max pages fetched: 1,000.
                            </p>
                        )}
                    </div>

                    {tab === "sitemap" && (
                        <div className="space-y-1.5">
                            <Label htmlFor="kb-sitemap-pattern" className="text-body-sm font-medium text-body-strong">
                                Pattern
                            </Label>
                            <Input
                                id="kb-sitemap-pattern"
                                value={sitemapPattern}
                                onChange={(e) => setSitemapPattern(e.target.value)}
                                placeholder="*/blog/*"
                            />
                            <p className="text-caption text-muted">
                                Only include sitemap URLs that match this pattern. All URLs are included if left empty.
                            </p>
                        </div>
                    )}

                    {tab === "website" && (
                        <>
                            <div className="space-y-1.5">
                                <Label className="text-body-sm font-medium text-body-strong">
                                    Crawl depth
                                </Label>
                                <p className="text-caption text-muted">
                                    Control how deep the crawler will follow links from the starting URL.
                                </p>
                                <div className="inline-flex rounded-lg bg-surface-strong p-0.5" role="radiogroup">
                                    {[1, 2, 3, 4, 5].map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            role="radio"
                                            aria-checked={websiteDepth === d}
                                            onClick={() => setWebsiteDepth(d)}
                                            className={cn(
                                                "rounded-md px-3 py-1 text-body-sm font-medium transition-colors",
                                                websiteDepth === d
                                                    ? "bg-surface-card text-ink shadow-sm"
                                                    : "text-muted hover:text-body-strong",
                                            )}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="kb-website-maxurls" className="text-body-sm font-medium text-body-strong">
                                    Max number of URLs
                                </Label>
                                <Input
                                    id="kb-website-maxurls"
                                    type="number"
                                    value={websiteMaxUrls}
                                    onChange={(e) => setWebsiteMaxUrls(Number(e.target.value))}
                                    min={1}
                                    max={10000}
                                />
                                <p className="text-caption text-muted">
                                    Limit the no. of unique URLs to crawl from the website. Max: 10,000.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="kb-website-pattern" className="text-body-sm font-medium text-body-strong">
                                    Pattern
                                </Label>
                                <Input
                                    id="kb-website-pattern"
                                    value={websitePattern}
                                    onChange={(e) => setWebsitePattern(e.target.value)}
                                    placeholder="*/blog/*"
                                />
                                <p className="text-caption text-muted">
                                    Only follow URLs that match this pattern. All URLs included if left empty.
                                </p>
                            </div>
                        </>
                    )}

                    <div className="border-t border-hairline pt-3">
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={busy || !url}
                                className={kbModalPrimaryClass}
                            >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {busyLabel}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ------------------------------------------------------------------ */
/*  Files Dialog                                                       */
/* ------------------------------------------------------------------ */

function FilesDialog({
    open,
    onOpenChange,
    folders,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    folders: KnowledgeDashboardPayload["folders"];
    onSuccess: () => void;
}) {
    const [busy, setBusy] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [files, setFiles] = React.useState<File[]>([]);
    const [folderId, setFolderId] = React.useState("__none__");
    const [drag, setDrag] = React.useState(false);

    React.useEffect(() => {
        if (!open) {
            setFiles([]);
            setFolderId("__none__");
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
        if (!files.length) { toast.error("Add at least one file"); return; }
        setBusy(true);
        try {
            const fd = new FormData();
            for (const f of files) fd.append("files", f);
            if (folderId && folderId !== "__none__") fd.append("folderId", folderId);
            const res = await uploadKnowledgeFiles(fd);
            if (!res.success) { toast.error(res.error); return; }
            onOpenChange(false);
            onSuccess();
        } finally { setBusy(false); }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-xl border-hairline bg-surface-card p-4 shadow-md sm:max-w-[480px]">
                <ModalHeader icon={<Upload className="h-5 w-5" aria-hidden />} title="Add Files" />

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="kb-files-folder" className="text-body-sm font-medium text-body-strong">
                            Parent folder
                        </Label>
                        <FolderSelect
                            id="kb-files-folder"
                            value={folderId}
                            onChange={setFolderId}
                            folders={folders}
                        />
                    </div>

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
                            drag ? "border-ink/25 bg-surface-strong" : "hover:border-hairline-strong hover:bg-canvas-soft",
                        )}
                    >
                        <Upload className="mb-3 h-8 w-8 text-muted" aria-hidden />
                        <p className="text-body-sm text-body">
                            Drag and drop files here
                        </p>
                        <p className="mt-1 text-caption text-muted">
                            or{" "}
                            <span className="font-medium text-ink underline underline-offset-2">browse</span> from your computer
                        </p>
                        <p className="mt-2 text-caption text-muted-soft">
                            Supported formats: PDF, DOCX, TXT
                        </p>
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
                                    <span className="min-w-0 flex-1 truncate font-medium text-ink">{f.name}</span>
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
                                {busy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    `Upload${files.length ? ` (${files.length})` : ""}`
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ------------------------------------------------------------------ */
/*  Text Dialog                                                        */
/* ------------------------------------------------------------------ */

function TextDialog({
    open,
    onOpenChange,
    folders,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    folders: KnowledgeDashboardPayload["folders"];
    onSuccess: () => void;
}) {
    const [busy, setBusy] = React.useState(false);
    const [title, setTitle] = React.useState("");
    const [content, setContent] = React.useState("");
    const [folderId, setFolderId] = React.useState("__none__");

    React.useEffect(() => {
        if (!open) {
            setTitle("");
            setContent("");
            setFolderId("__none__");
            setBusy(false);
        }
    }, [open]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        try {
            const res = await createKnowledgeText({
                title,
                content,
                folderId: folderId !== "__none__" ? folderId : null,
            });
            if (!res.success) {
                toast.error(res.error);
                return;
            }
            onOpenChange(false);
            onSuccess();
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
                        <Label htmlFor="kb-text-folder" className="text-body-sm font-medium text-body-strong">
                            Parent folder
                        </Label>
                        <FolderSelect
                            id="kb-text-folder"
                            value={folderId}
                            onChange={setFolderId}
                            folders={folders}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="kb-text-title" className="text-body-sm font-medium text-body-strong">
                            Document title
                        </Label>
                        <Input
                            id="kb-text-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter title"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="kb-text-body" className="text-body-sm font-medium text-body-strong">
                            Content
                        </Label>
                        <Textarea
                            id="kb-text-body"
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
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Document"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ------------------------------------------------------------------ */
/*  Folder Dialog                                                      */
/* ------------------------------------------------------------------ */

function FolderDialog({
    open,
    onOpenChange,
    folders,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    folders: KnowledgeDashboardPayload["folders"];
    onSuccess: () => void;
}) {
    const [busy, setBusy] = React.useState(false);
    const [name, setName] = React.useState("");
    const [parentFolderId, setParentFolderId] = React.useState("__none__");
    React.useEffect(() => {
        if (!open) {
            setName("");
            setParentFolderId("__none__");
            setBusy(false);
        }
    }, [open]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        try {
            const res = await createKnowledgeFolder({
                name,
                parentFolderId: parentFolderId !== "__none__" ? parentFolderId : null,
            });
            if (!res.success) {
                toast.error(res.error);
                return;
            }
            onOpenChange(false);
            onSuccess();
        } finally {
            setBusy(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-xl border-hairline bg-surface-card p-4 shadow-md sm:max-w-[480px]">
                <ModalHeader
                    icon={<FolderPlus className="h-5 w-5" aria-hidden />}
                    title="Create Folder"
                />

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="kb-folder-parent" className="text-body-sm font-medium text-body-strong">
                            Parent folder
                        </Label>
                        <FolderSelect
                            id="kb-folder-parent"
                            value={parentFolderId}
                            onChange={setParentFolderId}
                            folders={folders}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="kb-folder-name" className="text-body-sm font-medium text-body-strong">
                            Folder name
                        </Label>
                        <Input
                            id="kb-folder-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter a name for your folder"
                            required
                        />
                    </div>

                    <div className="border-t border-hairline pt-3">
                        <div className="flex justify-end">
                            <Button type="submit" disabled={busy} className={kbModalPrimaryClass}>
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Folder"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
