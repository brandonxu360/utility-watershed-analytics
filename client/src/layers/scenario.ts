export const AVAILABLE_SCENARIOS = [
  "undisturbed",
  "thinning_40_75",
  "thinning_65_93",
  "prescribed_fire",
  "wildfire",
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

/** One-sentence description for each scenario. */
export const SCENARIO_DESCRIPTIONS: Record<ScenarioType, string> = {
  undisturbed:
    "Typical healthy forest with full ground cover — the baseline for comparing all other scenarios.",
  thinning_40_75:
    "Mechanical fuel treatment with moderate ground disturbance, representing a lower-intensity thinning approach.",
  thinning_65_93:
    "Mechanical fuel treatment with higher canopy retention, representing a higher-intensity thinning approach.",
  prescribed_fire:
    "Planned, low-intensity burning that reduces ground cover more than thinning but far less than uncontrolled wildfire.",
  wildfire:
    "Simulates uncontrolled wildfire with major vegetation and ground cover loss, representing worst-case erosion and water quality impacts.",
};

/** Format scenario name for display (e.g., "thinning_40_75" → "Thinning 40-75") */
export function formatScenarioLabel(scenario: ScenarioType): string {
  return scenario
    .replace(/(\d+)_(\d+)/g, "$1-$2")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
