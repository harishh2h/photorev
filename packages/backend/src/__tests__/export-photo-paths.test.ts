import {
  exportDisplayNameForPhoto,
  zipEntryNameForPhoto,
  zipEntryNamesForPhotos,
  type ExportPhotoRow,
} from "../utils/export-photo-paths";

const photo = (overrides: Partial<ExportPhotoRow> = {}): ExportPhotoRow => ({
  id: "11111111-1111-1111-1111-111111111111",
  original_name: "DSC_0001.CR2.jpg",
  original_path: null,
  preview_path: null,
  ...overrides,
});

describe("exportDisplayNameForPhoto", () => {
  it("uses original upload name by default", () => {
    expect(exportDisplayNameForPhoto(photo())).toBe("DSC_0001.CR2.jpg");
  });

  it("uses renamed label when set", () => {
    expect(
      exportDisplayNameForPhoto(photo({ renamed_to: "Ceremony kiss" })),
    ).toBe("Ceremony kiss");
  });

  it("appends original extension when rename has no extension", () => {
    expect(
      exportDisplayNameForPhoto(
        photo({ original_name: "IMG_1234.jpg", renamed_to: "Best shot" }),
      ),
    ).toBe("Best shot.jpg");
  });
});

describe("zipEntryNameForPhoto", () => {
  it("does not prefix with sequence numbers", () => {
    expect(zipEntryNameForPhoto(photo(), "original")).toBe("DSC_0001.CR2.jpg");
  });

  it("uses rename for original variant", () => {
    expect(
      zipEntryNameForPhoto(photo({ renamed_to: "Final edit.jpg" }), "original"),
    ).toBe("Final edit.jpg");
  });

  it("uses rename stem with jpg extension for preview variant", () => {
    expect(
      zipEntryNameForPhoto(photo({ renamed_to: "Final edit" }), "preview"),
    ).toBe("Final edit.jpg");
  });
});

describe("zipEntryNamesForPhotos", () => {
  it("dedupes colliding names", () => {
    const names = zipEntryNamesForPhotos(
      [photo({ id: "a" }), photo({ id: "b", original_name: "DSC_0001.CR2.jpg" })],
      "original",
    );
    expect(names).toEqual(["DSC_0001.CR2.jpg", "DSC_0001.CR2-2.jpg"]);
  });
});
