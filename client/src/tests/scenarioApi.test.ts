import { describe, it, expect, vi, beforeEach } from "vitest";
import * as queryUtils from "../api/queryUtils";

vi.mock("../api/queryUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/queryUtils")>();
  return {
    ...actual,
    postQuery: vi.fn().mockResolvedValue([]),
  };
});

const mockPostQuery = vi.mocked(queryUtils.postQuery);

const { fetchScenarioData } = await import("../api/scenarioApi");

const TEST_RUN_ID = "batch;;test-batch;;test-run";

describe("scenarioApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPostQuery.mockResolvedValue([]);
  });

  describe("fetchScenarioData - input validation", () => {
    it("throws when runId is empty", async () => {
      await expect(
        fetchScenarioData({ runId: "", scenario: "undisturbed" }),
      ).rejects.toThrow("Invalid runId");
    });

    it("throws when runId is whitespace only", async () => {
      await expect(
        fetchScenarioData({ runId: "   ", scenario: "undisturbed" }),
      ).rejects.toThrow("Invalid runId");
    });

    it("throws when scenario is falsy", async () => {
      await expect(
        fetchScenarioData({
          runId: TEST_RUN_ID,
          scenario: null as unknown as "undisturbed",
        }),
      ).rejects.toThrow("Scenario required");
    });

    it("accepts valid inputs", async () => {
      await expect(
        fetchScenarioData({ runId: TEST_RUN_ID, scenario: "undisturbed" }),
      ).resolves.not.toThrow();
      expect(mockPostQuery).toHaveBeenCalled();
    });
  });

  describe("fetchScenarioData - payload construction", () => {
    it("passes scenario to payload", async () => {
      await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "thinning_40_75",
      });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      expect(payload.scenario).toBe("thinning_40_75");
    });

    it("uses loss_pw0.hill.parquet dataset path", async () => {
      await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "undisturbed",
      });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      const datasets = payload.datasets as { path: string }[];
      expect(datasets[0].path).toContain("loss_pw0.hill.parquet");
    });

    it("queries wepp_id, runoff, and sediment_yield columns", async () => {
      await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "undisturbed",
      });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      const columns = payload.columns as string[];
      expect(columns.join(" ")).toContain("wepp_id");
      expect(columns.join(" ")).toContain("Runoff Volume");
      expect(columns.join(" ")).toContain("Sediment Yield");
    });

    it("orders by wepp_id", async () => {
      await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "undisturbed",
      });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      const orderBy = payload.order_by as string[];
      expect(orderBy).toContain("loss.wepp_id");
    });

    it("passes runId and error prefix to postQuery", async () => {
      await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "prescribed_fire",
      });

      expect(mockPostQuery).toHaveBeenCalledWith(
        TEST_RUN_ID,
        expect.any(Object),
        expect.stringContaining("prescribed_fire"),
      );
    });
  });

  describe("fetchScenarioData - response mapping", () => {
    it("maps rows to ScenarioDataRow with numeric fields", async () => {
      mockPostQuery.mockResolvedValue([
        { wepp_id: 1, runoff: 10.5, sediment_yield: 20.3 },
        { wepp_id: 2, runoff: 5.2, sediment_yield: 8.1 },
      ]);

      const result = await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "undisturbed",
      });

      expect(result).toEqual([
        { wepp_id: 1, runoff: 10.5, sediment_yield: 20.3 },
        { wepp_id: 2, runoff: 5.2, sediment_yield: 8.1 },
      ]);
    });

    it("uses toFiniteNumber fallback for non-numeric values", async () => {
      mockPostQuery.mockResolvedValue([
        { wepp_id: "abc", runoff: null, sediment_yield: undefined },
      ]);

      const result = await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "undisturbed",
      });

      expect(result).toEqual([{ wepp_id: 0, runoff: 0, sediment_yield: 0 }]);
    });

    it("handles string-typed numeric values", async () => {
      mockPostQuery.mockResolvedValue([
        { wepp_id: "42", runoff: "10.5", sediment_yield: "20.3" },
      ]);

      const result = await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "undisturbed",
      });

      expect(result).toEqual([
        { wepp_id: 42, runoff: 10.5, sediment_yield: 20.3 },
      ]);
    });

    it("returns empty array when postQuery returns no rows", async () => {
      mockPostQuery.mockResolvedValue([]);

      const result = await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "undisturbed",
      });

      expect(result).toEqual([]);
    });

    it("propagates postQuery errors", async () => {
      mockPostQuery.mockRejectedValue(new Error("Query failed: 500"));

      await expect(
        fetchScenarioData({ runId: TEST_RUN_ID, scenario: "undisturbed" }),
      ).rejects.toThrow("Query failed: 500");
    });
  });
});
