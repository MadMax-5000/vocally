/** Human-readable byte counts for RAG / storage UI. */
export function formatStorageBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"] as const;
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(k)),
  );
  const value = bytes / Math.pow(k, i);
  const decimals = i === 0 ? 0 : value < 10 ? 1 : 1;
  return `${value.toFixed(decimals)} ${sizes[i]}`;
}
