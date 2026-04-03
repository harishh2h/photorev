import fs from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

const THUMBNAIL_MAX_PX = 320;
const PREVIEW_MAX_PX = 1920;
const THUMB_FILENAME = "thumb.jpeg";
const PREVIEW_FILENAME = "preview.jpeg";

/**
 * Sharp-based transforms for a photo directory (the folder containing `original.*`).
 * The directory is derived from DB `original_path` via `dirname` (e.g. `…/photos/{projectId}/{photoId}/`).
 */
export class ImageProcessor {
  /**
   * Locates `original.<ext>` in the photo directory (case-insensitive prefix `original.`).
   */
  private async resolveOriginalPath(photoDir: string): Promise<string> {
    const names = await fs.readdir(photoDir);
    const match = names.find((n) => n.toLowerCase().startsWith("original."));
    if (!match) {
      throw new Error(`No original.* file in ${photoDir}`);
    }
    return path.join(photoDir, match);
  }

  /**
   * Writes `thumb.jpeg` (JPEG, max edge THUMBNAIL_MAX_PX, `fit: inside`).
   */
  async generateThumbnail(photoDir: string): Promise<string> {
    const input = await this.resolveOriginalPath(photoDir);
    const output = path.join(photoDir, THUMB_FILENAME);
    await sharp(input)
      .rotate()
      .resize(THUMBNAIL_MAX_PX, THUMBNAIL_MAX_PX, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(output);
    return output;
  }

  /**
   * Writes `preview.jpeg` (JPEG, max edge PREVIEW_MAX_PX, fit inside).
   */
  async generatePreview(photoDir: string): Promise<string> {
    const input = await this.resolveOriginalPath(photoDir);
    const output = path.join(photoDir, PREVIEW_FILENAME);
    await sharp(input)
      .rotate()
      .resize(PREVIEW_MAX_PX, PREVIEW_MAX_PX, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(output);
    return output;
  }

  /**
   * Reads raw Sharp metadata from the original file.
   */
  async readMetadata(photoDir: string): Promise<Metadata> {
    const input = await this.resolveOriginalPath(photoDir);
    return sharp(input).metadata();
  }

  /**
   * Builds JSON-safe metadata plus dimensions for `photos.metadata` / `width` / `height`.
   * Omits Buffer fields (exif, icc, etc.) so JSONB storage does not bloat or fail.
   */
  static metadataToRow(meta: Metadata): {
    metadata: Record<string, unknown>;
    width: number | null;
    height: number | null;
  } {
    const metadata: Record<string, unknown> = {
      format: meta.format ?? null,
      space: meta.space ?? null,
      channels: meta.channels ?? null,
      density: meta.density ?? null,
      hasAlpha: meta.hasAlpha ?? null,
      orientation: meta.orientation ?? null,
      chromaSubsampling: meta.chromaSubsampling ?? null,
      isProgressive: meta.isProgressive ?? null,
      pages: meta.pages ?? null,
      pageHeight: meta.pageHeight ?? null,
      pagePrimary: meta.pagePrimary ?? null,
      hasProfile: meta.hasProfile ?? null,
    };
    return {
      metadata,
      width: meta.width ?? null,
      height: meta.height ?? null,
    };
  }

  /**
   * Single Sharp read for the metadata job: filesystem + CPU work only (no DB).
   */
  async extractMetadataForDatabase(photoDir: string): Promise<{
    metadata: Record<string, unknown>;
    width: number | null;
    height: number | null;
  }> {
    const meta = await this.readMetadata(photoDir);
    return ImageProcessor.metadataToRow(meta);
  }
}
