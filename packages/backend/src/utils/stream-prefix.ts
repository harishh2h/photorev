import { Readable } from "stream";
import {
  classifyUploadHeader,
  detectAllowedImageMime,
  IMAGE_UPLOAD_SNIFF_BYTE_LIMIT,
  InvalidImageUploadError,
} from "./validate-image-upload";

/** Smallest prefix that can identify common image signatures (e.g. WebP RIFF header). */
const MIN_SNIFF_BYTES = 12;

export interface SniffedUploadStream {
  readonly prefix: Buffer;
  /** Null when the entire upload fit in `prefix` (stream ended). */
  readonly tail: Readable | null;
  readonly mimeType: string;
}

/** Drains unread bytes in the background so multipart parsers can finish cleanly. */
export function discardRemainder(stream: NodeJS.ReadableStream): void {
  const readable = stream as Readable;
  if (readable.readableEnded || readable.destroyed) {
    return;
  }
  const cleanup = () => {
    readable.removeListener("end", cleanup);
    readable.removeListener("close", cleanup);
    readable.removeListener("error", cleanup);
  };
  readable.on("end", cleanup);
  readable.on("close", cleanup);
  readable.on("error", cleanup);
  readable.resume();
}

/**
 * Sniffs magic bytes as early as possible, rejects non-images immediately, and
 * returns the buffered prefix plus any remaining stream tail for valid uploads.
 */
export async function sniffImageUploadStream(
  stream: NodeJS.ReadableStream,
): Promise<SniffedUploadStream> {
  const chunks: Buffer[] = [];
  let total = 0;
  let settled = false;

  return new Promise((resolve, promiseReject) => {
    const cleanup = () => {
      stream.removeListener("data", onData);
      stream.removeListener("end", onEnd);
      stream.removeListener("error", onError);
    };

    const fail = (err: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      discardRemainder(stream);
      promiseReject(err);
    };

    const succeed = (prefix: Buffer, tail: Readable | null, mimeType: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ prefix, tail, mimeType });
    };

    const onData = (chunk: Buffer) => {
      if (settled) return;

      chunks.push(chunk);
      total += chunk.length;
      stream.pause();

      void (async () => {
        if (settled) return;

        const prefix = Buffer.concat(chunks);

        if (prefix.length < MIN_SNIFF_BYTES && total < IMAGE_UPLOAD_SNIFF_BYTE_LIMIT) {
          stream.resume();
          return;
        }

        try {
          const classification = await classifyUploadHeader(prefix);

          if (settled) return;

          if (classification.status === "rejected") {
            fail(new InvalidImageUploadError());
            return;
          }

          if (classification.status === "allowed") {
            succeed(prefix, stream as Readable, classification.mime);
            return;
          }

          // inconclusive — need more bytes
          if (total >= IMAGE_UPLOAD_SNIFF_BYTE_LIMIT) {
            fail(new InvalidImageUploadError());
            return;
          }

          stream.resume();
        } catch (err) {
          fail(err);
        }
      })();
    };

    const onEnd = () => {
      if (settled) return;

      void (async () => {
        try {
          const prefix = Buffer.concat(chunks);
          const mimeType = await detectAllowedImageMime(prefix);
          succeed(prefix, null, mimeType);
        } catch (err) {
          fail(err);
        }
      })();
    };

    const onError = (err: Error) => {
      fail(err);
    };

    stream.on("data", onData);
    stream.on("end", onEnd);
    stream.on("error", onError);

    if ("resume" in stream && typeof stream.resume === "function") {
      stream.resume();
    }
  });
}
