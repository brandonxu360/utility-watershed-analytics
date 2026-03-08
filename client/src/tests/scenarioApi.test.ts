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

const { fetchScenarioData, fetchScenariosSummary } =
  await import("../api/scenarioApi");

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

    it("omits scenario from payload for wildfire", async () => {
      await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "wildfire",
      });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      expect(payload.scenario).toBeUndefined();
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

    it("queries all required columns", async () => {
      await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "undisturbed",
      });

      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      const columns = payload.columns as string[];
      const joined = columns.join(" ");
      expect(joined).toContain("wepp_id");
      expect(joined).toContain("Runoff Volume");
      expect(joined).toContain("Subrunoff Volume");
      expect(joined).toContain("Baseflow Volume");
      expect(joined).toContain("Soil Loss");
      expect(joined).toContain("Sediment Deposition");
      expect(joined).toContain("Sediment Yield");
      expect(joined).toContain("Hillslope Area");
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
    it("maps rows to ScenarioDataRow with all numeric fields", async () => {
      mockPostQuery.mockResolvedValue([
        {
          wepp_id: 1,
          runoff: 10.5,
          subrunoff: 3.2,
          baseflow: 1.1,
          soil_loss: 0.5,
          sediment_deposition: 0.3,
          sediment_yield: 20.3,
          hillslope_area: 5000,
        },
        {
          wepp_id: 2,
          runoff: 5.2,
          subrunoff: 2.0,
          baseflow: 0.8,
          soil_loss: 0.2,
          sediment_deposition: 0.1,
          sediment_yield: 8.1,
          hillslope_area: 3000,
        },
      ]);

      const result = await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "undisturbed",
      });

      expect(result).toEqual([
        {
          wepp_id: 1,
          runoff: 10.5,
          subrunoff: 3.2,
          baseflow: 1.1,
          soil_loss: 0.5,
          sediment_deposition: 0.3,
          sediment_yield: 20.3,
          hillslope_area: 5000,
        },
        {
          wepp_id: 2,
          runoff: 5.2,
          subrunoff: 2.0,
          baseflow: 0.8,
          soil_loss: 0.2,
          sediment_deposition: 0.1,
          sediment_yield: 8.1,
          hillslope_area: 3000,
        },
      ]);
    });

    it("uses toFiniteNumber fallback for non-numeric values", async () => {
      mockPostQuery.mockResolvedValue([
        {
          wepp_id: "abc",
          runoff: null,
          subrunoff: null,
          baseflow: null,
          soil_loss: null,
          sediment_deposition: null,
          sediment_yield: undefined,
          hillslope_area: undefined,
        },
      ]);

      const result = await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "undisturbed",
      });

      expect(result).toEqual([
        {
          wepp_id: 0,
          runoff: 0,
          subrunoff: 0,
          baseflow: 0,
          soil_loss: 0,
          sediment_deposition: 0,
          sediment_yield: 0,
          hillslope_area: 0,
        },
      ]);
    });

    it("handles string-typed numeric values", async () => {
      mockPostQuery.mockResolvedValue([
        {
          wepp_id: "42",
          runoff: "10.5",
          subrunoff: "3.2",
          baseflow: "1.1",
          soil_loss: "0.5",
          sediment_deposition: "0.3",
          sediment_yield: "20.3",
          hillslope_area: "5000",
        },
      ]);

      const result = await fetchScenarioData({
        runId: TEST_RUN_ID,
        scenario: "undisturbed",
      });

      expect(result).toEqual([
        {
          wepp_id: 42,
          runoff: 10.5,
          subrunoff: 3.2,
          baseflow: 1.1,
          soil_loss: 0.5,
          sediment_deposition: 0.3,
          sediment_yield: 20.3,
          hillslope_area: 5000,
        },
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

describe("fetchScenariosSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPostQuery.mockResolvedValue([]);
  });

  describe("input validation", () => {
    it("throws when runId is empty", async () => {
      await expect(fetchScenariosSummary("")).rejects.toThrow("Invalid runId");
    });

    it("throws when runId is whitespace only", async () => {
      await expect(fetchScenariosSummary("   ")).rejects.toThrow(
        "Invalid runId",
      );
    });

    it("accepts a valid runId", async () => {
      await expect(fetchScenariosSummary(TEST_RUN_ID)).resolves.not.toThrow();
    });
  });

  describe("payload construction", () => {
    it("sends one postQuery call per available scenario", async () => {
      await fetchScenariosSummary(TEST_RUN_ID);
      // 5 scenarios: undisturbed, thinning_40_75, thinning_65_93, prescribed_fire, wildfire
      expect(mockPostQuery).toHaveBeenCalledTimes(5);
    });

    it("uses loss_pw0.out.parquet dataset path", async () => {
      await fetchScenariosSummary(TEST_RUN_ID);
      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      const datasets = payload.datasets as { path: string }[];
      expect(datasets[0].path).toContain("loss_pw0.out.parquet");
    });

    it("queries key and value columns", async () => {
      await fetchScenariosSummary(TEST_RUN_ID);
      const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
      const columns = payload.columns as string[];
      expect(columns.join(" ")).toContain("key");
      expect(columns.join(" ")).toContain("value");
    });

    it("passes scenario in payload for non-wildfire scenarios", async () => {
      await fetchScenariosSummary(TEST_RUN_ID);
      const scenarios = mockPostQuery.mock.calls.map(
        (call) => (call[1] as Record<string, unknown>).scenario,
      );
      expect(scenarios).toContain("undisturbed");
      expect(scenarios).toContain("thinning_40_75");
      expect(scenarios).toContain("thinning_65_93");
      expect(scenarios).toContain("prescribed_fire");
    });

    it("omits scenario from payload for wildfire", async () => {
      await fetchScenariosSummary(TEST_RUN_ID);
      // wildfire is the 5th scenario (index 4)
      const wildfirePayload = mockPostQuery.mock.calls[4][1] as Record<string, unknown>;
      expect(wildfirePayload.scenario).toBeUndefined();
    });
  });

  describe("response mapping and unit conversion", () => {
    const makeSummaryRows = (overrides: Record<string, number> = {}) => {
      const defaults: Record<string, number> = {
        "Total contributing area to outlet": 100,
        "Avg. Ann. water discharge from outlet": 50000,
        "Avg. Ann. total hillslope soil loss": 1.5,
        "Avg. Ann. total channel soil loss": 0.8,
        "Avg. Ann. sediment discharge from outlet": 2.3,
        ...overrides,
      };
      return Object.entries(defaults).map(([key, value]) => ({ key, value }));
    };

    it("maps metrics to ScenarioSummaryRow fields with per-hectare conversion", async () => {
      mockPostQuery.mockResolvedValue(makeSummaryRows());

      const result = await fetchScenariosSummary(TEST_RUN_ID);

      expect(result.length).toBe(5);
      const row = result[0];
      // 1.5 / 100 = 0.015 t/ha
      expect(row.hillslopeSoilLoss).toBeCloseTo(0.015);
      // 0.8 / 100 = 0.008 t/ha
      expect(row.channelSoilLoss).toBeCloseTo(0.008);
      // 2.3 / 100 = 0.023 t/ha
      expect(row.sedimentDischarge).toBeCloseTo(0.023);
    });

    it("converts water discharge from m³ to mm (discharge / (area * 10000) * 1000)", async () => {
      mockPostQuery.mockResolvedValue(
        makeSummaryRows({
          "Total contributing area to outlet": 200,
          "Avg. Ann. water discharge from outlet": 40000,
        }),
      );

      const result = await fetchScenariosSummary(TEST_RUN_ID);
      const row = result[0];
      // waterDischarge = (40000 / (200 * 10_000)) * 1_000 = 20
      expect(row.waterDischarge).toBeCloseTo(20);
    });

    it("sets soil-loss fields to null when totalArea is zero", async () => {
      mockPostQuery.mockResolvedValue(
        makeSummaryRows({
          "Total contributing area to outlet": 0,
          "Avg. Ann. water discharge from outlet": 50000,
        }),
      );

      const result = await fetchScenariosSummary(TEST_RUN_ID);
      expect(result[0].waterDischarge).toBeNull();
      expect(result[0].hillslopeSoilLoss).toBeNull();
      expect(result[0].channelSoilLoss).toBeNull();
      expect(result[0].sedimentDischarge).toBeNull();
    });

    it("sets waterDischarge to null when discharge metric is missing", async () => {
      const rows = makeSummaryRows();
      const filtered = rows.filter(
        (r) => r.key !== "Avg. Ann. water discharge from outlet",
      );
      mockPostQuery.mockResolvedValue(filtered);

      const result = await fetchScenariosSummary(TEST_RUN_ID);
      expect(result[0].waterDischarge).toBeNull();
    });

    it("formats scenario label correctly including wildfire", async () => {
      mockPostQuery.mockResolvedValue(makeSummaryRows());

      const result = await fetchScenariosSummary(TEST_RUN_ID);
      const labels = result.map((r) => r.label);
      expect(labels).toContain("Undisturbed");
      expect(labels).toContain("Thinning 40-75");
      expect(labels).toContain("Prescribed Fire");
      expect(labels).toContain("Wildfire");
    });

    it("skips scenarios with no metrics (empty rows)", async () => {
      let callCount = 0;
      mockPostQuery.mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? makeSummaryRows() : [];
      });

      const result = await fetchScenariosSummary(TEST_RUN_ID);
      expect(result.length).toBe(2);
    });

    it("returns empty array when all scenarios return empty metrics", async () => {
      mockPostQuery.mockResolvedValue([]);

      const result = await fetchScenariosSummary(TEST_RUN_ID);
      expect(result).toEqual([]);
    });

    it("ignores non-finite metric values", async () => {
      mockPostQuery.mockResolvedValue([
        { key: "Total contributing area to outlet", value: 100 },
        { key: "Avg. Ann. total hillslope soil loss", value: "not-a-number" },
        { key: "Avg. Ann. total channel soil loss", value: NaN },
      ]);

      const result = await fetchScenariosSummary(TEST_RUN_ID);
      const row = result[0];
      expect(row.hillslopeSoilLoss).toBeNull();
      expect(row.channelSoilLoss).toBeNull();
    });
  });

  describe("error handling / partial failure", () => {
    it("returns fulfilled results when some scenarios fail", async () => {
      let callCount = 0;
      mockPostQuery.mockImplementation(async () => {
        callCount++;
        if (callCount === 2) throw new Error("Network error");
        return [
          { key: "Total contributing area to outlet", value: 100 },
          { key: "Avg. Ann. total hillslope soil loss", value: 1.5 },
        ];
      });

      const result = await fetchScenariosSummary(TEST_RUN_ID);
      // 4 out of 5 succeed
      expect(result.length).toBe(4);
    });

    it("throws when all scenarios fail", async () => {
      mockPostQuery.mockRejectedValue(new Error("Server down"));

      await expect(fetchScenariosSummary(TEST_RUN_ID)).rejects.toThrow(
        /Failed to fetch scenario summaries/,
      );
    });

    it("includes runId and failure reasons in all-fail error message", async () => {
      mockPostQuery.mockRejectedValue(new Error("timeout"));

      await expect(fetchScenariosSummary(TEST_RUN_ID)).rejects.toThrow(
        TEST_RUN_ID,
      );
    });
  });
});
