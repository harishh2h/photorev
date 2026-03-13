import fs from "fs";
import path from "path";
import { pipeline } from "stream";

const STORAGE_ROOT =
  process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage");
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
  const relativePath = path.join("photos", projectId, photoId, filename);

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