import { postQuery, toFiniteNumber } from "./queryUtils";
import type { ScenarioType, ScenarioDataRow } from "../layers/scenario";
import { AVAILABLE_SCENARIOS, formatScenarioLabel } from "../layers/scenario";

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
): Promise<ScenarioDataRow[]> {
  const { runId, scenario } = opts;

  if (!runId?.trim()) throw new Error("Invalid runId");
  if (!scenario) throw new Error("Scenario required");

  const payload = {
    scenario,
    datasets: [{ alias: "loss", path: SCENARIO_LOSS_PATH }],
    columns: [
      "loss.wepp_id AS wepp_id",
      'loss."Runoff Volume" AS runoff',
      'loss."Sediment Yield" AS sediment_yield',
    ],
    order_by: ["loss.wepp_id"],
  };

  const rows = await postQuery(runId, payload, `Scenario (${scenario})`);

  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      wepp_id: toFiniteNumber(row.wepp_id, 0),
      runoff: toFiniteNumber(row.runoff, 0),
      sediment_yield: toFiniteNumber(row.sediment_yield, 0),
    };
  });
}

export type ScenarioSummaryRow = {
  scenario: ScenarioType;
  label: string;
  totalArea: number | null;
  waterDischarge: number | null;
  hillslopeSoilLoss: number | null;
  channelSoilLoss: number | null;
  sedimentDischarge: number | null;
};

/**
 * Fetch watershed-level summary data for every scenario in parallel.
 */
export async function fetchScenariosSummary(
  runId: string,
): Promise<ScenarioSummaryRow[]> {
  if (!runId?.trim()) throw new Error("Invalid runId");

  const results = await Promise.allSettled(
    AVAILABLE_SCENARIOS.map(async (scenario) => {
      const payload = {
        scenario,
        datasets: [{ alias: "loss", path: SCENARIO_SUMMARY_PATH }],
        columns: ["loss.key AS key", "loss.value AS value"],
      };

      const rows = await postQuery(
        runId,
        payload,
        `Scenario Summary (${scenario})`,
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

      return {
        scenario,
        label: formatScenarioLabel(scenario),
        totalArea,
        waterDischarge,
        hillslopeSoilLoss:
          metrics.get("Avg. Ann. total hillslope soil loss") ?? null,
        channelSoilLoss:
          metrics.get("Avg. Ann. total channel soil loss") ?? null,
        sedimentDischarge:
          metrics.get("Avg. Ann. sediment discharge from outlet") ?? null,
      };
    }),
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<ScenarioSummaryRow | null> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value)
    .filter((r): r is ScenarioSummaryRow => r !== null);
}
