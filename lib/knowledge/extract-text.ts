const TXT_MIME = "text/plain";
const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const SUPPORTED_MIME_TYPES = [TXT_MIME, PDF_MIME, DOCX_MIME] as const;
const SUPPORTED_EXTENSIONS = [".txt", ".pdf", ".docx"] as const;

export function isSupportedMimeType(mime: string): boolean {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mime);
}

export function isSupportedExtension(name: string): boolean {
  const ext = "." + name.split(".").pop()?.toLowerCase();
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}

export async function extractTextFromBuffer(
  buffer: ArrayBuffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  if (mimeType === TXT_MIME) {
    return new TextDecoder().decode(buffer);
  }

  if (mimeType === PDF_MIME) {
    const { getDocumentProxy, extractText } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  if (mimeType === DOCX_MIME) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });
    return result.value;
  }

  const ext = "." + (fileName.split(".").pop()?.toLowerCase() ?? "");
  if (ext === ".pdf") {
    const { getDocumentProxy, extractText } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });
    return result.value;
  }

  if (ext === ".txt") {
    return new TextDecoder().decode(buffer);
  }

  throw new Error(`Unsupported file type: ${mimeType || ext || "unknown"}`);
}
