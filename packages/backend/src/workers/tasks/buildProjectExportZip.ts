import fs from "node:fs";
import path from "node:path";
import * as archiverModule from "archiver";

/** archiver@8 exports ZipArchive as a named export (no default under CJS/tsx). */
type ZipArchiveInstance = {
  file: (path: string, data: { name: string }) => void;
  pipe: (dest: NodeJS.WritableStream) => NodeJS.WritableStream;
  finalize: () => Promise<void>;
  pointer: () => number;
  on: (event: "error", handler: (err: Error) => void) => void;
};

const ZipArchive = (
  archiverModule as unknown as {
    ZipArchive: new (options?: { zlib?: { level: number } }) => ZipArchiveInstance;
  }
).ZipArchive;

export interface ZipBuildEntry {
  readonly absolutePath: string;
  readonly entryName: string;
}

export interface BuildProjectExportZipParams {
  readonly outputAbsolutePath: string;
  readonly entries: readonly ZipBuildEntry[];
  readonly onProgress?: (processedCount: number) => void | Promise<void>;
}

const PROGRESS_EVERY = 5;

/**
 * Streams existing files into a ZIP on disk (low memory — no full-file buffers).
 */
export async function buildProjectExportZip(
  params: BuildProjectExportZipParams,
): Promise<{ byteSize: number }> {
  await fs.promises.mkdir(path.dirname(params.outputAbsolutePath), { recursive: true });

  const output = fs.createWriteStream(params.outputAbsolutePath);
  const archive = new ZipArchive({ zlib: { level: 1 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      resolve({ byteSize: archive.pointer() });
    });
    archive.on("error", reject);
    output.on("error", reject);
    archive.pipe(output);

    void (async () => {
      try {
        let processed = 0;
        for (const entry of params.entries) {
          archive.file(entry.absolutePath, { name: entry.entryName });
          processed += 1;
          if (
            params.onProgress &&
            (processed % PROGRESS_EVERY === 0 || processed === params.entries.length)
          ) {
            await params.onProgress(processed);
          }
        }
        await archive.finalize();
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    })();
  });
}
