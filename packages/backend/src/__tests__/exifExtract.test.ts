import path from "node:path";
import { extractPhotoExif } from "../workers/tasks/exifExtract";

const SAMPLE_ORIGINAL = path.join(
  __dirname,
  "../../storage/photos/625da42e-4d86-45bf-abf4-fd61a0bd9f5b/2bad6b75-2a14-4626-8704-4eeab8ff1ceb/original.jpg",
);

describe("extractPhotoExif", () => {
  it("parses camera and exposure tags from a Sony JPEG", async () => {
    const exif = await extractPhotoExif(SAMPLE_ORIGINAL);
    expect(exif).not.toBeNull();
    expect(exif?.make).toBe("SONY");
    expect(exif?.model).toBe("ILCE-6600");
    expect(exif?.iso).toBe(6400);
    expect(exif?.exposureTimeSec).toBeCloseTo(0.0125);
    expect(exif?.lensModel).toMatch(/18-135mm/);
    expect(typeof exif?.capturedAt).toBe("string");
    expect(exif?.offsetTime).toBe("+05:30");
  });

  it("returns null for a missing file", async () => {
    const exif = await extractPhotoExif("/tmp/photorev-missing-file.jpg");
    expect(exif).toBeNull();
  });
});
