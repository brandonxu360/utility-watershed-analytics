import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchLanduse } from "../api/landuseApi";
import * as queryUtils from "../api/queryUtils";

vi.mock("../api/queryUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/queryUtils")>();
  return {
    ...actual,
    postQuery: vi.fn().mockResolvedValue([]),
  };
});

const mockPostQuery = vi.mocked(queryUtils.postQuery);

const TEST_RUN_PATH = "batch;;test-batch;;test-run";

describe("landuseApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPostQuery.mockResolvedValue([]);
  });

  describe("fetchLanduse - input validation", () => {
    it("throws error when runId is empty", async () => {
      await expect(fetchLanduse({ runId: "" })).rejects.toThrow(
        "Invalid runId provided",
      );
    });

    it("throws error when runId is whitespace only", async () => {
      await expect(fetchLanduse({ runId: "   " })).rejects.toThrow(
        "Invalid runId provided",
      );
    });

    it("accepts valid runId", async () => {
      await expect(
        fetchLanduse({ runId: TEST_RUN_PATH }),
      ).resolves.not.toThrow();
      expect(mockPostQuery).toHaveBeenCalled();
    });
  });

  describe("fetchLanduse - payload construction", () => {
    it("uses default scenario 'undisturbed' when not provided", async () => {
      await fetchLanduse({ runId: TEST_RUN_PATH });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      expect(payload.scenario).toBe("undisturbed");
    });

    it("uses provided scenario", async () => {
      await fetchLanduse({ runId: TEST_RUN_PATH, scenario: "fire-severity" });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      expect(payload.scenario).toBe("fire-severity");
    });

    it("uses default limit of 200000 when not provided", async () => {
      await fetchLanduse({ runId: TEST_RUN_PATH });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      expect(payload.limit).toBe(200000);
    });

    it("uses provided limit", async () => {
      await fetchLanduse({ runId: TEST_RUN_PATH, limit: 100 });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      expect(payload.limit).toBe(100);
    });

    it("includes correct dataset path", async () => {
      await fetchLanduse({ runId: TEST_RUN_PATH });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      const datasets = payload.datasets as Array<{
        path: string;
        alias: string;
      }>;
      expect(datasets).toHaveLength(1);
      expect(datasets[0].path).toBe("landuse/landuse.parquet");
      expect(datasets[0].alias).toBe("landuse");
    });

    it("only queries required columns (topaz_id, desc, color)", async () => {
      await fetchLanduse({ runId: TEST_RUN_PATH });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      const columns = payload.columns as string[];
      expect(columns).toHaveLength(3);
      expect(columns).toContain("landuse.topaz_id AS topaz_id");
      expect(columns).toContain("landuse.desc AS desc");
      expect(columns).toContain("landuse.color AS color");
    });

    it("orders by topaz_id", async () => {
      await fetchLanduse({ runId: TEST_RUN_PATH });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      expect(payload.order_by).toEqual(["landuse.topaz_id"]);
    });

    it("adds include_schema flag when provided", async () => {
      await fetchLanduse({ runId: TEST_RUN_PATH, include_schema: true });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      expect(payload.include_schema).toBe(true);
    });

    it("adds include_sql flag when provided", async () => {
      await fetchLanduse({ runId: TEST_RUN_PATH, include_sql: true });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      expect(payload.include_sql).toBe(true);
    });
  });

  describe("fetchLanduse - response mapping", () => {
    it("returns a Record mapping topaz_id to {desc, color}", async () => {
      mockPostQuery.mockResolvedValue([
        { topaz_id: 1, desc: "Deciduous Forest", color: "#228B22" },
        { topaz_id: 2, desc: "Grassland", color: "#90EE90" },
      ]);

      const result = await fetchLanduse({ runId: TEST_RUN_PATH });

      expect(result).toEqual({
        1: { desc: "Deciduous Forest", color: "#228B22" },
        2: { desc: "Grassland", color: "#90EE90" },
      });
    });

    it("handles alternate field names for topaz_id", async () => {
      mockPostQuery.mockResolvedValue([
        { topazid: 1, desc: "Forest", color: "#228B22" },
        { TopazID: 2, desc: "Grass", color: "#90EE90" },
        { TopazId: 3, desc: "Water", color: "#0000FF" },
      ]);

      const result = await fetchLanduse({ runId: TEST_RUN_PATH });

      expect(Object.keys(result)).toHaveLength(3);
      expect(result[1]).toEqual({ desc: "Forest", color: "#228B22" });
      expect(result[2]).toEqual({ desc: "Grass", color: "#90EE90" });
      expect(result[3]).toEqual({ desc: "Water", color: "#0000FF" });
    });

    it("handles alternate field names for desc", async () => {
      mockPostQuery.mockResolvedValue([
        { topaz_id: 1, landuse_desc: "Shrubland", color: "#8B4513" },
      ]);

      const result = await fetchLanduse({ runId: TEST_RUN_PATH });

      expect(result[1].desc).toBe("Shrubland");
    });

    it("handles alternate field names for color", async () => {
      mockPostQuery.mockResolvedValue([
        { topaz_id: 1, desc: "Urban", landuse_color: "#FF5733" },
      ]);

      const result = await fetchLanduse({ runId: TEST_RUN_PATH });

      expect(result[1].color).toBe("#FF5733");
    });

    it("uses empty strings for missing desc/color", async () => {
      mockPostQuery.mockResolvedValue([{ topaz_id: 1 }]);

      const result = await fetchLanduse({ runId: TEST_RUN_PATH });

      expect(result[1]).toEqual({ desc: "", color: "" });
    });

    it("skips rows with non-finite topaz_id", async () => {
      mockPostQuery.mockResolvedValue([
        { topaz_id: 1, desc: "Valid", color: "#111" },
        { topaz_id: null, desc: "Null", color: "#222" },
        { topaz_id: undefined, desc: "Undefined", color: "#333" },
        { desc: "Missing", color: "#444" },
        { topaz_id: "not-a-number", desc: "String", color: "#555" },
        { topaz_id: 2, desc: "Also Valid", color: "#666" },
      ]);

      const result = await fetchLanduse({ runId: TEST_RUN_PATH });

      expect(Object.keys(result)).toHaveLength(2);
      expect(result[1]).toEqual({ desc: "Valid", color: "#111" });
      expect(result[2]).toEqual({ desc: "Also Valid", color: "#666" });
    });

    it("returns empty object when no valid rows", async () => {
      mockPostQuery.mockResolvedValue([
        { topaz_id: null },
        { topaz_id: "bad" },
      ]);

      const result = await fetchLanduse({ runId: TEST_RUN_PATH });

      expect(result).toEqual({});
    });

    it("returns empty object when postQuery returns empty", async () => {
      mockPostQuery.mockResolvedValue([]);

      const result = await fetchLanduse({ runId: TEST_RUN_PATH });

      expect(result).toEqual({});
    });
  });

  describe("fetchLanduse - error handling", () => {
    it("propagates postQuery errors", async () => {
      mockPostQuery.mockRejectedValue(new Error("Landuse query failed: 500"));

      await expect(fetchLanduse({ runId: TEST_RUN_PATH })).rejects.toThrow(
        "Landuse query failed: 500",
      );
    });
  });
});
