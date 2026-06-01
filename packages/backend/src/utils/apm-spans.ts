import type { Span } from "elastic-apm-node";
import apm from "../instrument";

type SpanLabels = Record<string, string | number | boolean>;

export function startBackgroundSpan(
  name: string,
  type: string,
  labels?: SpanLabels,
): Span | null {
  if (!apm.isStarted()) {
    return null;
  }
  const span = apm.startSpan(name, type);
  if (!span) {
    return null;
  }
  if (labels) {
    for (const [key, value] of Object.entries(labels)) {
      span.setLabel(key, value);
    }
  }
  return span;
}

export function endBackgroundSpan(span: Span | null): void {
  span?.end();
}

export function captureBackgroundError(error: Error): void {
  if (apm.isStarted()) {
    apm.captureError(error);
  }
}
