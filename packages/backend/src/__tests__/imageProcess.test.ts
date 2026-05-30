import { ImageProcessor } from "../workers/tasks/imageProcess";

describe("ImageProcessor.metadataToRow", () => {
  it("stores raw file dimensions and keeps orientation in metadata", () => {
    const row = ImageProcessor.metadataToRow({
      width: 6000,
      height: 4000,
      orientation: 6,
      format: "jpeg",
    });

    expect(row.width).toBe(6000);
    expect(row.height).toBe(4000);
    expect(row.metadata.orientation).toBe(6);
    expect(row.metadata.format).toBe("jpeg");
  });

  it("stores upright dimensions unchanged", () => {
    const row = ImageProcessor.metadataToRow({
      width: 4032,
      height: 3024,
      orientation: 1,
      format: "jpeg",
    });

    expect(row.width).toBe(4032);
    expect(row.height).toBe(3024);
  });
});
