import { applyProjectGridFilters } from "../utils/project-grid-filters";

const baseRows = [
  {
    status: "ready",
    my_decision: 1,
    final_decision: 1,
    conflict_state: null,
  },
  {
    status: "ready",
    my_decision: -1,
    final_decision: -1,
    conflict_state: null,
  },
  {
    status: "ready",
    my_decision: null,
    final_decision: null,
    conflict_state: "pending_owner",
  },
  {
    status: "trashed",
    my_decision: null,
    final_decision: null,
    conflict_state: null,
  },
];

describe("applyProjectGridFilters", () => {
  it("returns visible photos for all filter", () => {
    const result = applyProjectGridFilters(baseRows, { scope: "mine", filter: "all" });
    expect(result).toHaveLength(3);
  });

  it("filters mine liked", () => {
    const result = applyProjectGridFilters(baseRows, { scope: "mine", filter: "liked" });
    expect(result).toHaveLength(1);
    expect(result[0]?.my_decision).toBe(1);
  });

  it("filters team rejected", () => {
    const result = applyProjectGridFilters(baseRows, { scope: "team", filter: "rejected" });
    expect(result).toHaveLength(1);
    expect(result[0]?.final_decision).toBe(-1);
  });

  it("filters conflicts on visible photos", () => {
    const result = applyProjectGridFilters(baseRows, { scope: "team", filter: "conflicts" });
    expect(result).toHaveLength(1);
    expect(result[0]?.conflict_state).toBe("pending_owner");
  });

  it("filters trashed photos only for trashed filter", () => {
    const result = applyProjectGridFilters(baseRows, { scope: "mine", filter: "trashed" });
    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe("trashed");
  });
});
