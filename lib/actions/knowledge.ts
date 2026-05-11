"use server";

import { auth } from "@clerk/nextjs/server";
import { KnowledgeSourceKind } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { getKnowledgeStorageQuotaBytes } from "@/lib/knowledge/quota";
import { uploadKnowledgeObject } from "@/lib/knowledge/storage";
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
      creatorLabel: string;
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
      creatorLabel: formatCreator(d.createdByClerkUserId),
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

    const content =
      "[URL — ingestion pending; vector indexing will use fetched content later.]";
    const sizeBytes = Buffer.byteLength(content, "utf8");

    await prisma.knowledgeDoc.create({
      data: {
        orgId,
        title: parsed.data.title.trim(),
        content,
        sourceKind: KnowledgeSourceKind.URL,
        sourceUrl: url,
        folderId,
        sizeBytes,
        createdByClerkUserId: clerkUserId,
      },
    });

    revalidatePath("/dashboard/knowledge");
    return { success: true as const };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false as const, error: "Could not save URL document" };
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

    await prisma.knowledgeDoc.create({
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

    revalidatePath("/dashboard/knowledge");
    return { success: true as const };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false as const, error: "Could not save text document" };
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

    for (const file of files) {
      const buf = await file.arrayBuffer();

      const doc = await prisma.knowledgeDoc.create({
        data: {
          orgId,
          title: file.name,
          content: "",
          sourceKind: KnowledgeSourceKind.FILE,
          sizeBytes: file.size,
          folderId,
          createdByClerkUserId: clerkUserId,
        },
      });

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
        data: {
          fileUrl: up.path,
          content: `[File upload — ${file.name}; text extraction for RAG pending.]`,
        },
      });
    }

    revalidatePath("/dashboard/knowledge");
    return { success: true as const };
  } catch (err) {
    Sentry.captureException(err);
    return { success: false as const, error: "Upload failed" };
  }
}
