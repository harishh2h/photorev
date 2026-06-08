import fs from "fs";
import path from "path";
import { extensionForDetectedMime } from "./validate-image-upload";
import { sniffImageUploadStream } from "./stream-prefix";

export function getStorageRoot(): string {
  return process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage");
}

export class RootPathValidationError extends Error {
  readonly code = "ROOT_PATH_INVALID" as const;
  constructor(message: string) {
    super(message);
    this.name = "RootPathValidationError";
  }
}

function posixRelUnderStorage(storedTrimmed: string): string | null {
  const root = path.resolve(getStorageRoot());
  const resolved = path.isAbsolute(storedTrimmed)
    ? path.resolve(storedTrimmed)
    : path.resolve(root, storedTrimmed);
  const rel = path.relative(root, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }
  if (rel === "") {
    return "";
  }
  return rel.split(path.sep).join("/");
}

/**
 * DB + API paths for blobs (photos, thumbnails) are POSIX paths relative to the storage root.
 * Returns null if path escapes storage root or resolves outside it (caller must not expose raw value).
 */
export function mediaStoragePathForApi(stored: string | null | undefined): string | null {
  if (stored == null) {
    return null;
  }
  const trimmed = String(stored).trim();
  if (!trimmed) {
    return null;
  }
  return posixRelUnderStorage(trimmed);
}



/**
 * Default + validated value stored in DB: always relative to storage root (`projects/:id`).
 * Rejects traversal and paths outside the storage root.
 */
export function normalizeProjectRootPathForPersist(rootPathInput: string | undefined, projectId: string): string {
  if (typeof rootPathInput !== "string" || rootPathInput.trim().length === 0) {
    return path.posix.join("projects", projectId);
  }
  const rel = posixRelUnderStorage(rootPathInput.trim());
  if (rel === null || rel === "" || rel.startsWith("/")) {
    throw new RootPathValidationError(
      "rootPath must be a path relative to the storage root without parent segments (..)",
    );
  }
  return rel.split(path.sep).join("/");
}

/**
 * Canonical relative path exposed on project APIs. Legacy DB rows using absolute paths under
 * the same machine's storage root are normalized; paths outside storage never leak verbatim.
 */
export function projectRootPathForApi(stored: string | undefined | null, projectId: string): string {
  if (stored == null || String(stored).trim().length === 0) {
    return path.posix.join("projects", projectId);
  }
  const rel = posixRelUnderStorage(stored.trim());
  if (rel !== null && rel !== "") {
    return rel.split(path.sep).join("/");
  }
  return path.posix.join("projects", projectId);
}

/**
 * Finds the first file in `dirAbsolute` whose name is `preview.<ext>` (any extension, case-insensitive).
 * Used so preview delivery does not assume a fixed extension.
 */
export async function findPreviewFileAbsolute(dirAbsolute: string): Promise<string | null> {
  let names: string[];
  try {
    names = await fs.promises.readdir(dirAbsolute);
  } catch {
    return null;
  }
  const match = names.find((n) => n.toLowerCase().startsWith("preview."));
  if (!match) {
    return null;
  }
  return path.join(dirAbsolute, match);
}

/**
 * Finds the first file in `dirAbsolute` whose name is `original.<ext>` (any extension, case-insensitive).
 */
export async function findOriginalFileAbsolute(dirAbsolute: string): Promise<string | null> {
  let names: string[];
  try {
    names = await fs.promises.readdir(dirAbsolute);
  } catch {
    return null;
  }
  const match = names.find((n) => n.toLowerCase().startsWith("original."));
  if (!match) {
    return null;
  }
  return path.join(dirAbsolute, match);
}
export interface SavedFile {
  photoId: string;
  filePath: string;
  absolutePath: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
}

async function writePrefixAndTail(
  absolutePath: string,
  prefix: Buffer,
  tail: NodeJS.ReadableStream | null,
): Promise<number> {
  if (!tail) {
    await fs.promises.writeFile(absolutePath, prefix);
    return prefix.length;
  }

  let fileSize = prefix.length;
  const writeStream = fs.createWriteStream(absolutePath);

  await new Promise<void>((resolve, reject) => {
    const onTailData = (chunk: Buffer) => {
      fileSize += chunk.length;
    };

    writeStream.on("error", reject);
    tail.on("error", reject);

    writeStream.write(prefix, (writeErr) => {
      if (writeErr) {
        reject(new Error(`Failed to save file: ${writeErr.message}`));
        return;
      }

      tail.on("data", onTailData);
      tail.pipe(writeStream);
      writeStream.on("finish", () => resolve());
      if ("resume" in tail && typeof tail.resume === "function") {
        tail.resume();
      }
    });
  });

  return fileSize;
}

export async function streamFileToDisk(
  fileStream: NodeJS.ReadableStream,
  fileName: string,
  projectId: string,
  photoId: string,
): Promise<SavedFile> {
  const { prefix, tail, mimeType } = await sniffImageUploadStream(fileStream);
  const ext = extensionForDetectedMime(mimeType);
  const filename = `original${ext}`;
  const dir = path.join(getStorageRoot(), "photos", projectId, photoId);
  const absolutePath = path.join(dir, filename);
  const relativePath = path.posix.join("photos", projectId, photoId, filename);

  await fs.promises.mkdir(dir, { recursive: true });

  let fileSize: number;
  try {
    fileSize = await writePrefixAndTail(absolutePath, prefix, tail);
  } catch (err) {
    await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => undefined);
    const message = err instanceof Error ? err.message : "Failed to save file";
    throw new Error(message);
  }

  return {
    photoId,
    filePath: relativePath,
    absolutePath,
    originalName: fileName,
    mimeType,
    fileSize,
  };
}

export async function removeUploadDir(
  projectId: string,
  photoId: string,
): Promise<void> {
  const dir = path.join(
    process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage"),
    "photos",
    projectId,
    photoId,
  );
  await fs.promises.rm(dir, { recursive: true, force: true });
}

/** Removes every uploaded/processed file tree under `photos/{projectId}/`. */
export async function removeProjectPhotoStorage(projectId: string): Promise<void> {
  const dir = path.join(getStorageRoot(), "photos", projectId);
  await fs.promises.rm(dir, { recursive: true, force: true });
}