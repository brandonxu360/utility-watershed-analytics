export const AVAILABLE_SCENARIOS = [
  "undisturbed",
  "thinning_40_75",
  "thinning_65_93",
  "prescribed_fire",
] as const;

export type ScenarioType = (typeof AVAILABLE_SCENARIOS)[number];

export const SCENARIO_VARIABLES = ["runoff", "sediment_yield"] as const;

export type ScenarioVariableType = (typeof SCENARIO_VARIABLES)[number];

export type ScenarioDataRow = {
  wepp_id: number;
  runoff: number;
  subrunoff: number;
  baseflow: number;
  soil_loss: number;
  sediment_deposition: number;
  sediment_yield: number;
  hillslope_area: number;
};

/** Colormap assignment per client requirements: water → winter, soil → jet2 */
export const SCENARIO_VARIABLE_CONFIG: Record<
  ScenarioVariableType,
  { label: string; colormap: string; unit: string }
> = {
  runoff: { label: "Runoff Volume", colormap: "winter", unit: "m³" },
  sediment_yield: { label: "Sediment Yield", colormap: "jet2", unit: "kg" },
};

/** Format scenario name for display (e.g., "thinning_40_75" → "Thinning 40-75") */
export function formatScenarioLabel(scenario: ScenarioType): string {
  return scenario
    .replace(/(\d+)_(\d+)/g, "$1-$2")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
