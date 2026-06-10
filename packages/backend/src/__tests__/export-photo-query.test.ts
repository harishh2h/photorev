import { describe, expect, it } from "vitest";
import { normalizeExportPhotoIds, resolveExportFilters } from "../utils/export-photo-query";

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

describe("normalizeExportPhotoIds", () => {
  it("deduplicates and sorts valid UUIDs", () => {
    const ids = normalizeExportPhotoIds([
      "b2b2b2b2-b2b2-4b2b-b2b2-b2b2b2b2b2b2",
      "a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1",
      "b2b2b2b2-b2b2-4b2b-b2b2-b2b2b2b2b2b2",
      "not-a-uuid",
    ]);
    expect(ids).toEqual([
      "a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1",
      "b2b2b2b2-b2b2-4b2b-b2b2-b2b2b2b2b2b2",
    ]);
  });

  it("parses jsonb string values from the database", () => {
    const ids = normalizeExportPhotoIds(
      JSON.stringify(["a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1"]),
    );
    expect(ids).toEqual(["a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1"]);
  });
});
