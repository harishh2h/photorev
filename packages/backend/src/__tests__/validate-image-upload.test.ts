import {
  classifyUploadHeader,
  detectAllowedImageMime,
  extensionForDetectedMime,
  InvalidImageUploadError,
} from "../utils/validate-image-upload";

/** Minimal valid JPEG (SOI + EOI). */
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

/** Minimal valid PNG (8-byte signature + IHDR chunk header). */
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

describe("classifyUploadHeader", () => {
  it("rejects PDF bytes immediately", async () => {
    await expect(classifyUploadHeader(Buffer.from("%PDF-1.4"))).resolves.toEqual({
      status: "rejected",
    });
  });

  it("allows JPEG bytes", async () => {
    await expect(classifyUploadHeader(JPEG_BYTES)).resolves.toEqual({
      status: "allowed",
      mime: "image/jpeg",
    });
  });
});

describe("detectAllowedImageMime", () => {
  it("accepts JPEG magic bytes", async () => {
    await expect(detectAllowedImageMime(JPEG_BYTES)).resolves.toBe("image/jpeg");
  });

  it("accepts PNG magic bytes", async () => {
    await expect(detectAllowedImageMime(PNG_BYTES)).resolves.toBe("image/png");
  });

  it("rejects empty buffer", async () => {
    await expect(detectAllowedImageMime(Buffer.alloc(0))).rejects.toBeInstanceOf(
      InvalidImageUploadError,
    );
  });

  it("rejects non-image content", async () => {
    await expect(
      detectAllowedImageMime(Buffer.from("plain text, not an image")),
    ).rejects.toBeInstanceOf(InvalidImageUploadError);
  });

  it("rejects PDF magic bytes", async () => {
    await expect(
      detectAllowedImageMime(Buffer.from("%PDF-1.4 fake content")),
    ).rejects.toBeInstanceOf(InvalidImageUploadError);
  });
});

describe("extensionForDetectedMime", () => {
  it("maps JPEG to .jpg", () => {
    expect(extensionForDetectedMime("image/jpeg")).toBe(".jpg");
  });

  it("maps HEIF to .heic", () => {
    expect(extensionForDetectedMime("image/heif")).toBe(".heic");
  });
});
