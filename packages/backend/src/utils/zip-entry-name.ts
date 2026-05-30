import path from "node:path";

/**
 * Safe single-segment name inside a ZIP archive.
 */
export function sanitizeZipEntryName(raw: string, fallback: string): string {
  const base = path.basename(String(raw || "").replace(/[/\\]/g, "_").trim());
  const cleaned = base.replace(/[\x00-\x1f\x7f]/g, "").replace(/"/g, "'");
  if (cleaned.length > 0) {
    return cleaned.slice(0, 200);
  }
  return fallback;
}
