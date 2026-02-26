import { postQuery, toFiniteNumber } from "./queryUtils";
import { ScenarioType, ScenarioDataRow } from "../store/store";

const SCENARIO_LOSS_PATH = "wepp/output/interchange/loss_pw0.hill.parquet";

export type FetchScenarioDataOptions = {
  runId: string;
  scenario: ScenarioType;
};

/**
 * Fetch WEPP loss data for a specific scenario.
 * Returns only the fields needed for visualization.
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
      'loss."Sediment Yield" AS sediment_yield',
    ],
    order_by: ["loss.wepp_id"],
  };

  const rows = await postQuery(runId, payload, `Scenario (${scenario})`);

  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      wepp_id: toFiniteNumber(row.wepp_id, 0),
      sediment_yield: toFiniteNumber(row.sediment_yield, 0),
    };
  });
}

export default fetchScenarioData;
