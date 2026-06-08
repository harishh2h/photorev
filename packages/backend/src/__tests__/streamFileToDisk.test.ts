import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { sniffImageUploadStream } from "../utils/stream-prefix";
import { streamFileToDisk } from "../utils/storage";
import { InvalidImageUploadError } from "../utils/validate-image-upload";

/** Minimal valid JPEG (SOI + EOI). */
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

describe("streamFileToDisk", () => {
  let storageRoot = "";

  beforeEach(async () => {
    storageRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "photorev-upload-"));
    process.env.STORAGE_ROOT = storageRoot;
  });

  afterEach(async () => {
    delete process.env.STORAGE_ROOT;
    if (storageRoot) {
      await fs.promises.rm(storageRoot, { recursive: true, force: true });
    }
  });

  it("stores detected extension and mime, not client filename", async () => {
    const projectId = "project-1";
    const photoId = "photo-1";
    const stream = Readable.from(JPEG_BYTES);

    const saved = await streamFileToDisk(stream, "fake-name.png", projectId, photoId);

    expect(saved.mimeType).toBe("image/jpeg");
    expect(saved.filePath).toBe("photos/project-1/photo-1/original.jpg");
    expect(saved.originalName).toBe("fake-name.png");
    expect(saved.fileSize).toBe(JPEG_BYTES.length);

    const onDisk = await fs.promises.readFile(
      path.join(storageRoot, "photos", projectId, photoId, "original.jpg"),
    );
    expect(onDisk.equals(JPEG_BYTES)).toBe(true);
  });

  it("writes full payload when upload exceeds sniff buffer", async () => {
    const projectId = "project-3";
    const photoId = "photo-3";
    const largeJpeg = Buffer.concat([JPEG_BYTES, Buffer.alloc(5000, 0x00)]);
    const stream = Readable.from(largeJpeg);

    const saved = await streamFileToDisk(stream, "large.jpg", projectId, photoId);

    expect(saved.fileSize).toBe(largeJpeg.length);
    const onDisk = await fs.promises.readFile(
      path.join(storageRoot, "photos", projectId, photoId, "original.jpg"),
    );
    expect(onDisk.equals(largeJpeg)).toBe(true);
  });

  it("rejects PDF masquerading as jpg after reading only a small prefix", async () => {
    const pdfHeader = Buffer.from("%PDF-1.4\n");
    const largeTail = Buffer.alloc(2_000_000, 0x00);
    let pushedTail = false;

    const stream = new Readable({
      read() {
        if (this.destroyed) return;
        if (pushedTail) {
          this.push(null);
          return;
        }
        this.push(pdfHeader);
        this.push(largeTail);
        pushedTail = true;
      },
    });

    const start = Date.now();
    await expect(sniffImageUploadStream(stream)).rejects.toBeInstanceOf(InvalidImageUploadError);
    expect(Date.now() - start).toBeLessThan(250);
  });

  it("rejects renamed non-image before writing", async () => {
    const projectId = "project-2";
    const photoId = "photo-2";
    const stream = Readable.from(Buffer.from("not an image"));

    await expect(
      streamFileToDisk(stream, "photo.jpg", projectId, photoId),
    ).rejects.toBeInstanceOf(InvalidImageUploadError);

    const photoDir = path.join(storageRoot, "photos", projectId, photoId);
    await expect(fs.promises.access(photoDir)).rejects.toThrow();
  });
});
