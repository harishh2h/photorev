const ROTATED_ORIENTATIONS = new Set([5, 6, 7, 8]);

export function parseOrientation(metadata: unknown): number | null {
  if (metadata == null || typeof metadata !== "object") {
    return null;
  }
  const orientation = (metadata as Record<string, unknown>).orientation;
  if (typeof orientation === "number" && Number.isFinite(orientation)) {
    return orientation;
  }
  if (typeof orientation === "string") {
    const parsed = Number.parseInt(orientation, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function getDisplayDimensions(
  width: number | null,
  height: number | null,
  orientation: number | null = null,
): { width: number | null; height: number | null } {
  if (width == null || height == null || width <= 0 || height <= 0) {
    return { width, height };
  }
  const resolvedOrientation = orientation ?? 1;
  if (ROTATED_ORIENTATIONS.has(resolvedOrientation)) {
    return { width: height, height: width };
  }
  return { width, height };
}

export function getDisplayDimensionsFromMetadata(
  width: number | null,
  height: number | null,
  metadata: unknown,
): { width: number | null; height: number | null } {
  return getDisplayDimensions(width, height, parseOrientation(metadata));
}
