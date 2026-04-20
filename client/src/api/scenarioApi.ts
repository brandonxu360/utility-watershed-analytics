import { queryOptions } from "@tanstack/react-query";
import { postQuery, toFiniteNumber } from "./queryUtils";
import { queryKeys } from "./queryKeys";
import { isApiError } from "./errors";
import type { QueryPayload } from "./types/query";
import { AVAILABLE_SCENARIOS, formatScenarioLabel } from "./types/scenario";
import type { ScenarioType, ScenarioDataRow } from "./types/scenario";

const SCENARIO_LOSS_PATH = "wepp/output/interchange/loss_pw0.hill.parquet";
const SCENARIO_SUMMARY_PATH = "wepp/output/interchange/loss_pw0.out.parquet";

export type FetchScenarioDataOptions = {
  runId: string;
  scenario: ScenarioType;
};

/**
 * Fetch WEPP loss data for a specific scenario.
 * Returns wepp_id, runoff, and sediment_yield for visualization.
 */
export async function fetchScenarioData(
  opts: FetchScenarioDataOptions,
  signal: AbortSignal,
): Promise<ScenarioDataRow[]> {
  const { runId, scenario } = opts;

  if (!runId?.trim()) throw new Error("Invalid runId");
  if (!scenario) throw new Error("Scenario required");

  const payload: QueryPayload = {
    datasets: [{ alias: "loss", path: SCENARIO_LOSS_PATH }],
    columns: [
      "loss.wepp_id AS wepp_id",
      'loss."Runoff Volume" AS runoff',
      'loss."Subrunoff Volume" AS subrunoff',
      'loss."Baseflow Volume" AS baseflow',
      'loss."Soil Loss" AS soil_loss',
      'loss."Sediment Deposition" AS sediment_deposition',
      'loss."Sediment Yield" AS sediment_yield',
      'loss."Hillslope Area" AS hillslope_area',
    ],
    order_by: ["loss.wepp_id"],
  };

  // Wildfire data lives at the base run directory, not in a scenario subdirectory
  if (scenario !== "wildfire") {
    payload.scenario = scenario;
  }

  const rows = await postQuery(
    runId,
    payload,
    `Scenario (${scenario})`,
    signal,
  );

  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      wepp_id: toFiniteNumber(row.wepp_id, 0),
      runoff: toFiniteNumber(row.runoff, 0),
      subrunoff: toFiniteNumber(row.subrunoff, 0),
      baseflow: toFiniteNumber(row.baseflow, 0),
      soil_loss: toFiniteNumber(row.soil_loss, 0),
      sediment_deposition: toFiniteNumber(row.sediment_deposition, 0),
      sediment_yield: toFiniteNumber(row.sediment_yield, 0),
      hillslope_area: toFiniteNumber(row.hillslope_area, 0),
    };
  });
}

export type ScenarioSummaryRow = {
  scenario: ScenarioType;
  label: string;
  waterDischarge: number | null;
  hillslopeSoilLoss: number | null;
  channelSoilLoss: number | null;
  sedimentDischarge: number | null;
  /** Avg. annual hillslope soil loss in tonnes/year (raw metric value before per-ha conversion). */
  hillslopeSoilLossTonnesPerYear: number | null;
  /** Avg. annual channel soil loss in tonnes/year (raw metric value before per-ha conversion). */
  channelSoilLossTonnesPerYear: number | null;
  /** Avg. annual sediment discharge from outlet in tonnes/year (raw metric value before per-ha conversion). */
  sedimentDischargeTonnesPerYear: number | null;
};

/**
 * Fetch watershed-level summary data for every scenario in parallel.
 * Only scenarios that return data are included in the result,
 * so the result doubles as a list of available scenarios.
 */
export async function fetchScenariosSummary(
  runId: string,
  signal: AbortSignal,
): Promise<ScenarioSummaryRow[]> {
  if (!runId?.trim()) throw new Error("Invalid runId");

  const results = await Promise.allSettled(
    AVAILABLE_SCENARIOS.map(async (scenario) => {
      const payload: QueryPayload = {
        datasets: [{ alias: "loss", path: SCENARIO_SUMMARY_PATH }],
        columns: ["loss.key AS key", "loss.value AS value"],
      };

      // Wildfire data lives at the base run directory
      if (scenario !== "wildfire") {
        payload.scenario = scenario;
      }

      const rows = await postQuery(
        runId,
        payload,
        `Scenario Summary (${scenario})`,
        signal,
      );

      const metrics = new Map<string, number>();
      for (const r of rows) {
        const row = r as Record<string, unknown>;
        const key = String(row.key ?? "");
        const value = toFiniteNumber(row.value, NaN);
        if (key && Number.isFinite(value)) {
          metrics.set(key, value);
        }
      }

      if (metrics.size === 0) return null;

      const totalArea =
        metrics.get("Total contributing area to outlet") ?? null;
      const dischargeM3 =
        metrics.get("Avg. Ann. water discharge from outlet") ?? null;

      let waterDischarge: number | null = null;
      if (dischargeM3 != null && totalArea != null && totalArea > 0) {
        waterDischarge = (dischargeM3 / (totalArea * 10_000)) * 1_000;
      }

      const toPerHa = (val: number | null): number | null =>
        val != null && totalArea != null && totalArea > 0
          ? val / totalArea
          : null;

      const rawHillslopeSoilLoss =
        metrics.get("Avg. Ann. total hillslope soil loss") ?? null;
      const rawChannelSoilLoss =
        metrics.get("Avg. Ann. total channel soil loss") ?? null;
      const rawSedimentDischarge =
        metrics.get("Avg. Ann. sediment discharge from outlet") ?? null;

      return {
        scenario,
        label: formatScenarioLabel(scenario),
        waterDischarge,
        hillslopeSoilLoss: toPerHa(rawHillslopeSoilLoss),
        channelSoilLoss: toPerHa(rawChannelSoilLoss),
        sedimentDischarge: toPerHa(rawSedimentDischarge),
        hillslopeSoilLossTonnesPerYear: rawHillslopeSoilLoss,
        channelSoilLossTonnesPerYear: rawChannelSoilLoss,
        sedimentDischargeTonnesPerYear: rawSedimentDischarge,
      };
    }),
  );

  const fulfilledResults = results.filter(
    (r): r is PromiseFulfilledResult<ScenarioSummaryRow | null> =>
      r.status === "fulfilled",
  );
  const rejectedResults = results.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected",
  );

  if (fulfilledResults.length === 0 && rejectedResults.length > 0) {
    // If every failure is a 404, this watershed simply has no WEPP scenario
    // data — treat it as empty rather than an error.
    const allNotFound = rejectedResults.every(
      (r) => isApiError(r.reason) && r.reason.status === 404,
    );
    if (allNotFound) return [];

    const reasons = rejectedResults
      .map((r) => r.reason)
      .filter((reason) => reason != null)
      .map((reason) => String(reason));
    throw new Error(
      `Failed to fetch scenario summaries for runId "${runId}": ${reasons.join("; ")}`,
    );
  }

  return fulfilledResults
    .map((r) => r.value)
    .filter((r): r is ScenarioSummaryRow => r !== null);
}

export function scenariosSummaryOptions(runId: string | null) {
  return queryOptions<ScenarioSummaryRow[]>({
    queryKey: queryKeys.scenariosSummary.byRun(runId ?? ""),
    queryFn: ({ signal }) => fetchScenariosSummary(runId!, signal),
    enabled: !!runId,
    retry: 1,
  });
}
