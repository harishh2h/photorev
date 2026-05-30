import { sanitizeZipEntryName } from "../utils/zip-entry-name";

describe("sanitizeZipEntryName", () => {
  it("strips path segments", () => {
    expect(sanitizeZipEntryName("../../etc/passwd", "fallback.jpg")).toBe("passwd");
  });

  it("uses fallback for empty", () => {
    expect(sanitizeZipEntryName("", "photo-1.jpg")).toBe("photo-1.jpg");
  });
});
