import { postQuery, toFiniteNumber } from "./queryUtils";
import type { ScenarioType, ScenarioDataRow } from "../layers/scenario";

const SCENARIO_LOSS_PATH = "wepp/output/interchange/loss_pw0.hill.parquet";

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
      'loss."Subrunoff Volume" AS subrunoff',
      'loss."Baseflow Volume" AS baseflow',
      'loss."Soil Loss" AS soil_loss',
      'loss."Sediment Deposition" AS sediment_deposition',
      'loss."Sediment Yield" AS sediment_yield',
      'loss."Hillslope Area" AS hillslope_area',
    ],
    order_by: ["loss.wepp_id"],
  };

  const rows = await postQuery(runId, payload, `Scenario (${scenario})`);

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
