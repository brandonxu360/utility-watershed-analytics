import type { SubcatchmentProperties } from "../types/SubcatchmentProperties";
import type { ScenarioDataRow, ScenarioVariableType } from "../layers/scenario";
import type { VegetationBandType } from "./constants";

export type TooltipContext =
  | { layer: "scenario"; variable: ScenarioVariableType; row: ScenarioDataRow }
  | { layer: "landuse"; desc: string }
  | {
      layer: "choropleth";
      bands: VegetationBandType;
      year: number;
      value: number;
    }
  | { layer: "none" };

function formatMass(kg: number): string {
  if (Math.abs(kg) >= 1000)
    return `${(kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} t`;
  return `${kg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`;
}

function formatVolume(m3: number): string {
  return `${m3.toLocaleString(undefined, { maximumFractionDigits: 2 })} m³`;
}

function headerSection(props: Partial<SubcatchmentProperties>): string[] {
  return [
    `<strong>Hillslope ID</strong>`,
    `TopazID: ${props.topazid ?? "N/A"}, WeppID: ${props.weppid ?? "N/A"}`,
  ];
}

function geometrySection(props: Partial<SubcatchmentProperties>): string[] {
  return [
    `<strong>Width:</strong> ${props.width?.toFixed(2) ?? "N/A"} m`,
    `<strong>Length:</strong> ${props.length?.toFixed(2) ?? "N/A"} m`,
    `<strong>Area:</strong> ${props.hillslope_area ?? "N/A"} m²`,
    `<strong>Slope:</strong> ${props.slope_scalar?.toFixed(2) ?? "N/A"}`,
    `<strong>Aspect:</strong> ${props.aspect?.toFixed(2) ?? "N/A"}`,
    `<strong>Soil:</strong> ${props.simple_texture ?? "N/A"}`,
  ];
}

function scenarioSection(
  variable: ScenarioVariableType,
  row: ScenarioDataRow,
): string[] {
  const area = `<strong>Area:</strong> ${row.hillslope_area.toFixed(2)} ha`;
  if (variable === "runoff") {
    return [
      `<strong>Runoff Volume:</strong> ${formatVolume(row.runoff)}`,
      area,
    ];
  }
  // sediment_yield — show all three sediment fields together
  return [
    `<strong>Soil Loss:</strong> ${formatMass(row.soil_loss)}`,
    `<strong>Sediment Deposition:</strong> ${formatMass(row.sediment_deposition)}`,
    `<strong>Sediment Yield:</strong> ${formatMass(row.sediment_yield)}`,
    area,
  ];
}

function landuseSection(desc: string): string[] {
  return [`<strong>Land Use:</strong> ${desc}`];
}

const BAND_LABELS: Record<VegetationBandType, string> = {
  all: "Total Cover",
  shrub: "Shrub Cover",
  tree: "Tree Cover",
};

function choroplethSection(
  bands: VegetationBandType,
  year: number,
  value: number,
): string[] {
  const label = BAND_LABELS[bands];
  const pct = value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return [`<strong>${label} (${year}):</strong> ${pct}%`];
}

/**
 * Build the HTML tooltip for a subcatchment hillslope.
 *
 * The `context` discriminated union determines which coverage layer is active
 * and supplies only the data relevant to that layer.
 */
export function buildHillslopeTooltip(
  props: Partial<SubcatchmentProperties>,
  context: TooltipContext,
): string {
  let section: string[];

  switch (context.layer) {
    case "scenario":
      section = scenarioSection(context.variable, context.row);
      break;
    case "landuse":
      section = landuseSection(context.desc);
      break;
    case "choropleth":
      section = choroplethSection(context.bands, context.year, context.value);
      break;
    case "none":
      section = geometrySection(props);
      break;
  }

  const lines = [...headerSection(props), ...section];
  return `<span class="tooltip-bold">${lines.join("<br/>")}</span>`;
}
