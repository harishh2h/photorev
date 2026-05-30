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

/** Ensures each entry name is unique within one ZIP archive. */
export function uniquifyZipEntryName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const ext = path.extname(name);
  const stem = ext ? name.slice(0, -ext.length) : name;
  let i = 2;
  while (true) {
    const candidate = `${stem}-${i}${ext}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
    i += 1;
  }
}
