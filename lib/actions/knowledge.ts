"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { KnowledgeSourceKind } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { chunkText } from "@/lib/knowledge/chunking";
import { extractTextFromBuffer } from "@/lib/knowledge/extract-text";
import { getKnowledgeStorageQuotaBytes } from "@/lib/knowledge/quota";
import { uploadKnowledgeObject } from "@/lib/knowledge/storage";
import { insertChunks, deleteChunksByDocId } from "@/lib/knowledge/vector-store";
import { getOrgPrismaId } from "@/lib/server/organization";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const MAX_FILE_BYTES = 40 * 1024 * 1024;

export type KnowledgeFolderOption = {
  id: string;
  name: string;
  parentFolderId: string | null;
};

export type KnowledgeRow =
  | {
      kind: "folder";
      id: string;
      name: string;
      updatedAt: string;
      parentFolderId: string | null;
    }
  | {
      kind: "document";
      id: string;
      title: string;
      sourceKind: KnowledgeSourceKind;
      creatorEmail: string;
      folderName: string | null;
      updatedAt: string;
      sizeBytes: number;
    };

export type KnowledgeDashboardPayload = {
  rows: KnowledgeRow[];
  folders: KnowledgeFolderOption[];
  storageUsedBytes: number;
  quotaBytes: number;
};

function formatCreator(clerkUserId: string | null): string {
  if (!clerkUserId) return "—";
  if (clerkUserId.length <= 12) return clerkUserId;
  return `${clerkUserId.slice(0, 8)}…`;
}

async function getCreatorEmailsByClerkUserId(
  clerkUserIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ids = Array.from(new Set(clerkUserIds));
  if (ids.length === 0) return out;

  try {
    const client = await clerkClient();
    const usersRes = await client.users.getUserList({
      userId: ids,
      limit: ids.length,
    });
    for (const u of usersRes.data) {
      out.set(u.id, u.primaryEmailAddress?.emailAddress ?? "—");
    }
  } catch (err) {
    Sentry.captureException(err, { extra: { idsCount: ids.length } });
  }

  return out;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function sumOrgStorageBytes(orgId: string): Promise<number> {
  const agg = await prisma.knowledgeDoc.aggregate({
    where: { orgId },
    _sum: { sizeBytes: true },
  });
  return agg._sum.sizeBytes ?? 0;
}

async function assertFolderInOrg(
  folderId: string,
  orgId: string,
): Promise<boolean> {
  const folder = await prisma.knowledgeFolder.findFirst({
    where: { id: folderId, orgId },
    select: { id: true },
  });
  return Boolean(folder);
}

const createUrlSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().min(1).max(2000),
  folderId: z.string().optional().nullable(),
  mode: z.enum(["single", "sitemap", "website"]).optional().default("single"),
  pattern: z.string().max(500).optional(),
  crawlDepth: z.number().int().min(1).max(5).optional(),
  maxUrls: z.number().int().min(1).max(10000).optional(),
});

const createTextSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  folderId: z.string().optional().nullable(),
});

const createFolderSchema = z.object({
  name: z.string().min(1).max(120),
  parentFolderId: z.string().optional().nullable(),
});

export async function getKnowledgeDashboardData(): Promise<
  | { success: true; data: KnowledgeDashboardPayload }
  | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) {
      return { success: false, error: "Unauthorized" };
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });
    if (!org) {
      return { success: false, error: "Organization not found" };
    }

    const quotaBytes = getKnowledgeStorageQuotaBytes(org.plan);
    const storageUsedBytes = await sumOrgStorageBytes(orgId);

    const [folders, docs] = await Promise.all([
      prisma.knowledgeFolder.findMany({
        where: { orgId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          parentFolderId: true,
          updatedAt: true,
        },
      }),
      prisma.knowledgeDoc.findMany({
        where: { orgId },
        orderBy: { updatedAt: "desc" },
        include: {
          folder: { select: { name: true } },
        },
      }),
    ]);

    const folderOptions: KnowledgeFolderOption[] = await prisma.knowledgeFolder.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        parentFolderId: true,
      },
      orderBy: { name: "asc" },
    });

    const creatorEmailById = await getCreatorEmailsByClerkUserId(
      docs
        .map((d) => d.createdByClerkUserId)
        .filter((id): id is string => Boolean(id)),
    );

    const folderRows: KnowledgeRow[] = folders.map((f) => ({
      kind: "folder" as const,
      id: f.id,
      name: f.name,
      updatedAt: f.updatedAt.toISOString(),
      parentFolderId: f.parentFolderId,
    }));

    const docRows: KnowledgeRow[] = docs.map((d) => ({
      kind: "document" as const,
      id: d.id,
      title: d.title,
      sourceKind: d.sourceKind,
      creatorEmail:
        (d.createdByClerkUserId
          ? (creatorEmailById.get(d.createdByClerkUserId) ??
            formatCreator(d.createdByClerkUserId))
          : "—"),
      folderName: d.folder?.name ?? null,
      updatedAt: d.updatedAt.toISOString(),
      sizeBytes: d.sizeBytes,
    }));

    const rows = [...folderRows, ...docRows].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    return {
      success: true,
      data: {
        rows,
        folders: folderOptions,
        storageUsedBytes,
        quotaBytes,
      },
    };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false, error: "Failed to load knowledge base" };
  }
}

async function processFetchedPage(
  page: { url: string; title: string; content: string },
  orgId: string,
  folderId: string | null,
  clerkUserId: string | null,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const sizeBytes = Buffer.byteLength(page.content, "utf8");

    const doc = await prisma.knowledgeDoc.create({
      data: {
        orgId,
        title: page.title,
        content: page.content,
        sourceKind: KnowledgeSourceKind.URL,
        sourceUrl: page.url,
        folderId,
        sizeBytes,
        createdByClerkUserId: clerkUserId,
      },
    });

    const chunks = chunkText(page.content);
    if (chunks.length > 0) {
      const embeddingResults = await generateEmbeddings(chunks.map((c) => c.content));
      await insertChunks(
        chunks.map((c, i) => ({
          knowledgeDocId: doc.id,
          content: c.content,
          chunkIndex: c.chunkIndex,
          tokenCount: embeddingResults[i]?.tokenCount ?? c.tokenCount,
          embedding: embeddingResults[i]?.embedding ?? [],
        })),
      );
    }

    return { success: true, docId: doc.id };
  } catch (err) {
    Sentry.captureException(err, { extra: { url: page.url } });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

const FETCH_CONCURRENCY = 3;

async function processPagesConcurrently(
  urls: string[],
  orgId: string,
  folderId: string | null,
  clerkUserId: string | null,
): Promise<{ imported: number; errors: number; docIds: string[] }> {
  let imported = 0;
  let errors = 0;
  const docIds: string[] = [];

  for (let i = 0; i < urls.length; i += FETCH_CONCURRENCY) {
    const batch = urls.slice(i, i + FETCH_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (u) => {
        try {
          const { fetchAndExtractText } = await import("@/lib/knowledge/fetch-url");
          const page = await fetchAndExtractText(u);
          const result = await processFetchedPage(page, orgId, folderId, clerkUserId);
          return result.success
            ? ({ kind: "imported" as const, docId: result.docId })
            : ({ kind: "error" as const });
        } catch (err) {
          Sentry.captureException(err, { extra: { url: u } });
          return { kind: "error" as const };
        }
      }),
    );

    for (const r of results) {
      if (r.kind === "imported") {
        imported++;
        docIds.push(r.docId);
      } else {
        errors++;
      }
    }
  }

  return { imported, errors, docIds };
}

export async function createKnowledgeFromUrl(input: unknown) {
  try {
    const parsed = createUrlSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false as const, error: "Unauthorized" };

    const url = parsed.data.url.trim();
    if (!isValidHttpUrl(url)) {
      return { success: false as const, error: "Invalid URL (use https://…)" };
    }

    let folderId: string | null = parsed.data.folderId?.trim() || null;
    if (folderId && !(await assertFolderInOrg(folderId, orgId))) {
      return { success: false as const, error: "Invalid folder" };
    } else if (!folderId) {
      folderId = null;
    }

    const session = await auth();
    const clerkUserId = session.userId ?? null;

    const mode = parsed.data.mode ?? "single";

    if (mode === "single") {
      let page: { url: string; title: string; content: string };
      try {
        const { fetchAndExtractText } = await import("@/lib/knowledge/fetch-url");
        page = await fetchAndExtractText(url);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch URL";
        return { success: false as const, error: message };
      }
      const result = await processFetchedPage(page, orgId, folderId, clerkUserId);
      if (!result.success) {
        return { success: false as const, error: result.error };
      }

      revalidatePath("/dashboard/knowledge");
      return { success: true as const, pagesImported: 1, docIds: [result.docId] };
    }

    if (mode === "sitemap") {
      const { parseSitemap } = await import("@/lib/knowledge/parse-sitemap");
      let pageUrls: string[];
      try {
        pageUrls = await parseSitemap(url, parsed.data.pattern);
      } catch (err) {
        Sentry.captureException(err);
        return { success: false as const, error: "Failed to parse sitemap" };
      }

      if (pageUrls.length === 0) {
        return { success: false as const, error: "No URLs found in sitemap" };
      }

      const { imported, errors, docIds } = await processPagesConcurrently(
        pageUrls,
        orgId,
        folderId,
        clerkUserId,
      );

      revalidatePath("/dashboard/knowledge");
      return {
        success: true as const,
        pagesImported: imported,
        docIds,
        ...(errors > 0 ? { warning: `${errors} page(s) failed to import` } : {}),
      };
    }

    if (mode === "website") {
      const { crawlWebsite } = await import("@/lib/knowledge/crawl-website");
      let result: Awaited<ReturnType<typeof crawlWebsite>>;
      try {
        result = await crawlWebsite(url, {
          maxDepth: parsed.data.crawlDepth ?? 2,
          maxUrls: parsed.data.maxUrls ?? 1000,
          pattern: parsed.data.pattern,
        });
      } catch (err) {
        Sentry.captureException(err);
        return { success: false as const, error: "Failed to crawl website" };
      }

      if (result.urls.length === 0) {
        return { success: false as const, error: "No pages found on website" };
      }

      const { imported, errors, docIds } = await processPagesConcurrently(
        result.urls,
        orgId,
        folderId,
        clerkUserId,
      );

      revalidatePath("/dashboard/knowledge");
      return {
        success: true as const,
        pagesImported: imported,
        docIds,
        ...(errors > 0 ? { warning: `${errors} page(s) failed to import` } : {}),
      };
    }

    return { success: false as const, error: "Unknown mode" };
  } catch (err) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : "Could not save URL document";
    return { success: false as const, error: message };
  }
}

export async function createKnowledgeText(input: unknown) {
  try {
    const parsed = createTextSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false as const, error: "Unauthorized" };

    const content = parsed.data.content;
    const sizeBytes = Buffer.byteLength(content, "utf8");
    if (sizeBytes > MAX_TEXT_BYTES) {
      return { success: false as const, error: "Text exceeds size limit" };
    }

    let folderId: string | null = parsed.data.folderId?.trim() || null;
    if (folderId && !(await assertFolderInOrg(folderId, orgId))) {
      return { success: false as const, error: "Invalid folder" };
    } else if (!folderId) {
      folderId = null;
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });
    if (!org) return { success: false as const, error: "Organization not found" };

    const quotaBytes = getKnowledgeStorageQuotaBytes(org.plan);
    const used = await sumOrgStorageBytes(orgId);
    if (used + sizeBytes > quotaBytes) {
      return { success: false as const, error: "Storage quota exceeded" };
    }

    const session = await auth();
    const clerkUserId = session.userId ?? null;

    const doc = await prisma.knowledgeDoc.create({
      data: {
        orgId,
        title: parsed.data.title.trim(),
        content,
        sourceKind: KnowledgeSourceKind.TEXT,
        folderId,
        sizeBytes,
        createdByClerkUserId: clerkUserId,
      },
    });

    const chunks = chunkText(content);
    if (chunks.length > 0) {
      const embeddingResults = await generateEmbeddings(chunks.map((c) => c.content));
      await insertChunks(
        chunks.map((c, i) => ({
          knowledgeDocId: doc.id,
          content: c.content,
          chunkIndex: c.chunkIndex,
          tokenCount: embeddingResults[i]?.tokenCount ?? c.tokenCount,
          embedding: embeddingResults[i]?.embedding ?? [],
        })),
      );
    }

    revalidatePath("/dashboard/knowledge");
    return { success: true as const, docId: doc.id };
  } catch (err) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : "Could not save text document";
    return { success: false as const, error: message };
  }
}

export async function createKnowledgeFolder(input: unknown) {
  try {
    const parsed = createFolderSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false as const, error: "Unauthorized" };

    let parentFolderId: string | null = parsed.data.parentFolderId?.trim() || null;
    if (parentFolderId && !(await assertFolderInOrg(parentFolderId, orgId))) {
      return { success: false as const, error: "Invalid parent folder" };
    } else if (!parentFolderId) {
      parentFolderId = null;
    }

    await prisma.knowledgeFolder.create({
      data: {
        orgId,
        name: parsed.data.name.trim(),
        parentFolderId,
      },
    });

    revalidatePath("/dashboard/knowledge");
    return { success: true as const };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false as const, error: "Could not create folder" };
  }
}

export async function uploadKnowledgeFiles(formData: FormData) {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false as const, error: "Unauthorized" };

    if (!getSupabaseAdmin()) {
      return {
        success: false as const,
        error:
          "File storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      };
    }

    const folderRaw = formData.get("folderId");
    let folderId: string | null =
      typeof folderRaw === "string" && folderRaw.length > 0 ? folderRaw : null;
    if (folderId && !(await assertFolderInOrg(folderId, orgId))) {
      return { success: false as const, error: "Invalid folder" };
    } else if (!folderId) {
      folderId = null;
    }

    const rawFiles = formData.getAll("files");
    const files = rawFiles.filter((x): x is File => x instanceof File);
    if (files.length === 0) {
      return { success: false as const, error: "No files selected" };
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });
    if (!org) return { success: false as const, error: "Organization not found" };

    const quotaBytes = getKnowledgeStorageQuotaBytes(org.plan);
    const used = await sumOrgStorageBytes(orgId);

    let pendingTotal = 0;
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        return {
          success: false as const,
          error: `File "${f.name}" exceeds the maximum size.`,
        };
      }
      pendingTotal += f.size;
    }

    if (used + pendingTotal > quotaBytes) {
      return { success: false as const, error: "Storage quota exceeded" };
    }

    const session = await auth();
    const clerkUserId = session.userId ?? null;

    const docIds: string[] = [];
    for (const file of files) {
      const buf = await file.arrayBuffer();
      const extractBuf = buf.slice(0);

      let extractedContent = "";
      let extractionOk = false;
      try {
        extractedContent = await extractTextFromBuffer(extractBuf, file.type || "", file.name);
        extractionOk = extractedContent.trim().length > 0;
      } catch (err) {
        Sentry.captureException(err, {
          extra: { fileName: file.name, fileSize: file.size, orgId },
        });
      }

      const content = extractionOk
        ? extractedContent
        : `[File upload — ${file.name}; text extraction failed.]`;

      const doc = await prisma.knowledgeDoc.create({
        data: {
          orgId,
          title: file.name,
          content,
          sourceKind: KnowledgeSourceKind.FILE,
          sizeBytes: file.size,
          folderId,
          createdByClerkUserId: clerkUserId,
        },
      });
      docIds.push(doc.id);

      const up = await uploadKnowledgeObject({
        orgId,
        docId: doc.id,
        fileName: file.name,
        body: buf,
        contentType: file.type || "application/octet-stream",
      });

      if (!up.ok) {
        await prisma.knowledgeDoc.delete({ where: { id: doc.id } });
        return { success: false as const, error: up.message };
      }

      await prisma.knowledgeDoc.update({
        where: { id: doc.id },
        data: { fileUrl: up.path },
      });

      if (extractionOk) {
        const chunks = chunkText(extractedContent);
        if (chunks.length > 0) {
          const embeddingResults = await generateEmbeddings(chunks.map((c) => c.content));
          await insertChunks(
            chunks.map((c, i) => ({
              knowledgeDocId: doc.id,
              content: c.content,
              chunkIndex: c.chunkIndex,
              tokenCount: embeddingResults[i]?.tokenCount ?? c.tokenCount,
              embedding: embeddingResults[i]?.embedding ?? [],
            })),
          );
        }
      }
    }

    revalidatePath("/dashboard/knowledge");
    return { success: true as const, docIds };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false as const, error: "Upload failed" };
  }
}

export async function deleteKnowledgeDoc(docId: string) {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false as const, error: "Unauthorized" };

    const doc = await prisma.knowledgeDoc.findFirst({
      where: { id: docId, orgId },
      select: { id: true, sourceKind: true, fileUrl: true },
    });
    if (!doc) return { success: false as const, error: "Document not found" };

    await deleteChunksByDocId(doc.id);

    if (doc.fileUrl) {
      const { removeKnowledgeObject } = await import("@/lib/knowledge/storage");
      await removeKnowledgeObject(doc.fileUrl);
    }

    await prisma.knowledgeDoc.delete({ where: { id: doc.id } });

    revalidatePath("/dashboard/knowledge");
    return { success: true as const };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false as const, error: "Delete failed" };
  }
}
