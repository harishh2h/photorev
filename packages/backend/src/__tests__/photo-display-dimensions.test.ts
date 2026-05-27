import {
  getDisplayDimensions,
  getDisplayDimensionsFromMetadata,
  parseOrientation,
} from "../utils/photo-display-dimensions";

describe("photo-display-dimensions", () => {
  it("returns raw dimensions when orientation is upright", () => {
    expect(getDisplayDimensions(6000, 4000, 1)).toEqual({ width: 6000, height: 4000 });
  });

  it("swaps dimensions for 90-degree orientations", () => {
    expect(getDisplayDimensions(6000, 4000, 6)).toEqual({ width: 4000, height: 6000 });
    expect(getDisplayDimensions(6000, 4000, 8)).toEqual({ width: 4000, height: 6000 });
  });

  it("reads orientation from metadata JSON", () => {
    expect(parseOrientation({ orientation: 6 })).toBe(6);
    expect(getDisplayDimensionsFromMetadata(6000, 4000, { orientation: 6 })).toEqual({
      width: 4000,
      height: 6000,
    });
  });

  it("passes through null dimensions", () => {
    expect(getDisplayDimensionsFromMetadata(null, null, { orientation: 6 })).toEqual({
      width: null,
      height: null,
    });
  });
});
