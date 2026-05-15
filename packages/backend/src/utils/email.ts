/**
 * Same normalization as registration: trim + lowercase for storage and lookups.
 */
export function normalizeEmail(raw: string): string {
  return String(raw ?? "").trim().toLowerCase();
}

/** Simple sanity check — not full RFC validation. */
export function isPlausibleEmailShape(value: string): boolean {
  if (value.length === 0 || value.length > 255) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
