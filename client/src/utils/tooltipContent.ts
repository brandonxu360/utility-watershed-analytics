import type { SubcatchmentProperties } from "../types/SubcatchmentProperties";
import type { WatershedProperties } from "../types/WatershedProperties";
import type {
  ScenarioDataRow,
  ScenarioVariableType,
} from "../api/types/scenario";
import type { VegetationBandType } from "./constants";
import { startYear, endYear } from "./constants";

export type TooltipContext =
  | { layer: "scenario"; variable: ScenarioVariableType; row: ScenarioDataRow }
  | { layer: "landuse"; desc: string }
  | {
      layer: "choropleth";
      bands: VegetationBandType;
      year: number | null;
      value: number;
      components?: { shrub: number; tree: number };
    }
  | { layer: "none" };

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Tagged template literal that auto-escapes all interpolated values as HTML text. */
function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += escapeHtml(String(values[i] ?? ""));
    result += strings[i + 1];
  }
  return result;
}

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
    html`<strong>Soil:</strong> ${props.simple_texture ?? "N/A"}`,
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
  return [html`<strong>Land Use:</strong> ${desc}`];
}

const BAND_LABELS: Record<VegetationBandType, string> = {
  all: "Total Cover",
  shrub: "Shrub Cover",
  tree: "Tree Cover",
};

function choroplethSection(
  bands: VegetationBandType,
  year: number | null,
  value: number,
  components?: { shrub: number; tree: number },
): string[] {
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 1 });

  const yearLabel =
    year !== null ? `${year}` : `${startYear}\u2013${endYear} Average`;

  if (bands === "all" && components) {
    return [
      `<strong>${yearLabel}</strong>`,
      `<strong>Shrub Cover:</strong> ${fmt(components.shrub)}%`,
      `<strong>Tree Cover:</strong> ${fmt(components.tree)}%`,
      `<strong>Total Cover:</strong> ${fmt(value)}%`,
    ];
  }

  const label = BAND_LABELS[bands];
  return [
    `<strong>${yearLabel}</strong>`,
    `<strong>${label}:</strong> ${fmt(value)}%`,
  ];
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
      section = choroplethSection(
        context.bands,
        context.year,
        context.value,
        context.components,
      );
      break;
    case "none":
      section = geometrySection(props);
      break;
  }

  const lines = [...headerSection(props), ...section];
  return `<span class="tooltip-bold">${lines.join("<br/>")}</span>`;
}

export function buildWatershedTooltip(
  props: Partial<WatershedProperties> | null,
): string {
  const name = props?.pws_name ?? "Unknown Watershed";
  const parts = [props?.county_nam, props?.state].filter(Boolean) as string[];
  const namePart = html`<strong>${name}</strong>`;
  // ", " contains no HTML-special characters, so joining before escaping is safe
  const locationPart = parts.length > 0 ? html`<br />${parts.join(", ")}` : "";
  return `<span class="tooltip-bold">${namePart}${locationPart}</span>`;
}
