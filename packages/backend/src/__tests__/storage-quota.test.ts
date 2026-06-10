import {
  buildStorageQuotaSnapshot,
  hasQuotaRoom,
  parseAdminQuotaBytes,
} from "../utils/storage-quota";

describe("storage-quota utils", () => {
  it("treats null quota as unlimited", () => {
    expect(hasQuotaRoom(null, 1_000_000_000, 500)).toBe(true);
    expect(buildStorageQuotaSnapshot(null, 1_000_000_000).canUpload).toBe(true);
  });

  it("blocks upload when usage meets cap", () => {
    expect(hasQuotaRoom(1000, 1000, 1)).toBe(false);
    expect(buildStorageQuotaSnapshot(1000, 1000).canUpload).toBe(false);
    expect(buildStorageQuotaSnapshot(1000, 1000).remainingBytes).toBe(0);
  });

  it("blocks any upload when cap is zero", () => {
    expect(hasQuotaRoom(0, 0, 1)).toBe(false);
    expect(buildStorageQuotaSnapshot(0, 0).canUpload).toBe(false);
  });

  it("parses admin quota input", () => {
    expect(parseAdminQuotaBytes(null)).toBe(null);
    expect(parseAdminQuotaBytes("")).toBe(null);
    expect(parseAdminQuotaBytes(0)).toBe(0);
    expect(parseAdminQuotaBytes(1024)).toBe(1024);
    expect(parseAdminQuotaBytes(-1)).toBe("invalid");
    expect(parseAdminQuotaBytes("bad")).toBe("invalid");
  });
});
