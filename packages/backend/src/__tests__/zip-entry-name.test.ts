import { sanitizeZipEntryName, uniquifyZipEntryName } from "../utils/zip-entry-name";

describe("sanitizeZipEntryName", () => {
  it("strips path segments", () => {
    expect(sanitizeZipEntryName("../../etc/passwd", "fallback.jpg")).toBe("passwd");
  });

  it("uses fallback for empty", () => {
    expect(sanitizeZipEntryName("", "photo-1.jpg")).toBe("photo-1.jpg");
  });
});

describe("uniquifyZipEntryName", () => {
  it("suffixes duplicates", () => {
    const used = new Set<string>(["a.jpg"]);
    expect(uniquifyZipEntryName("a.jpg", used)).toBe("a-2.jpg");
    expect(uniquifyZipEntryName("a.jpg", used)).toBe("a-3.jpg");
  });
});
