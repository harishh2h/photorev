import { describe, expect, it } from "vitest";
import { resolveExportFilters } from "../utils/export-photo-query";

describe("resolveExportFilters", () => {
  it("defaults unknown values to mine + all", () => {
    expect(resolveExportFilters(undefined, undefined)).toEqual({
      scope: "mine",
      filter: "all",
    });
  });

  it("normalizes team scope and liked filter", () => {
    expect(resolveExportFilters("team", "liked")).toEqual({
      scope: "team",
      filter: "liked",
    });
  });

  it("falls back to all for invalid filter", () => {
    expect(resolveExportFilters("mine", "bogus")).toEqual({
      scope: "mine",
      filter: "all",
    });
  });
});
