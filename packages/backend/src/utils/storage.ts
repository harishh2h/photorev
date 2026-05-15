import fs from "fs";
import path from "path";
import { pipeline } from "stream";

const STORAGE_ROOT =
  process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage");

export function getStorageRoot(): string {
  return STORAGE_ROOT;
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
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/heic",
];

export interface SavedFile {
  photoId: string;
  filePath: string;
  absolutePath: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
}

function getSafeExt(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return ext || ".bin";
}

export async function streamFileToDisk(
  fileStream: NodeJS.ReadableStream,
  mimeType: string,
  fileName: string,
  projectId: string,
  photoId: string,
): Promise<SavedFile> {
  if (!ALLOWED_MIME.includes(mimeType)) {
    throw new Error(`Invalid mime type: ${mimeType}`);
  }

  const ext = getSafeExt(fileName);
  const filename = `original${ext}`;
  const dir = path.join(STORAGE_ROOT, "photos", projectId, photoId);
  const absolutePath = path.join(dir, filename);
  const relativePath = path.posix.join("photos", projectId, photoId, filename);

  await fs.promises.mkdir(dir, { recursive: true });

  let fileSize = 0;
  const writeStream = fs.createWriteStream(absolutePath);

  fileStream.on("data", (chunk: Buffer) => {
    fileSize += chunk.length;
  });

  await new Promise<void>((resolve, reject) => {
    pipeline(fileStream, writeStream, (err) => {
      if (err) reject(new Error(`Failed to save file: ${err.message}`));
      else resolve();
    });
  });

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