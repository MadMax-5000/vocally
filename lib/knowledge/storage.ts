import { getKnowledgeBucketName, getSupabaseAdmin } from "@/lib/supabase/admin";

const SAFE_NAME = /[^a-zA-Z0-9._-]+/g;

export function sanitizeKnowledgeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  return base.replace(SAFE_NAME, "_").slice(0, 180) || "file";
}

export type UploadKnowledgeResult =
  | { ok: true; path: string; bucket: string }
  | { ok: false; message: string };

/** Uploads file bytes to `{orgId}/{docId}/{safeFileName}` in the knowledge bucket. */
export async function uploadKnowledgeObject(params: {
  orgId: string;
  docId: string;
  fileName: string;
  body: ArrayBuffer;
  contentType: string;
}): Promise<UploadKnowledgeResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      ok: false,
      message:
        "File storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const bucket = getKnowledgeBucketName();
  const safe = sanitizeKnowledgeFileName(params.fileName);
  const path = `${params.orgId}/${params.docId}/${safe}`;

  const { error } = await supabase.storage.from(bucket).upload(path, params.body, {
    contentType: params.contentType || "application/octet-stream",
    upsert: true,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, path, bucket };
}

export async function removeKnowledgeObject(storagePath: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const bucket = getKnowledgeBucketName();
  await supabase.storage.from(bucket).remove([storagePath]);
}
