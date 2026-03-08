import type { SubcatchmentProperties } from "../types/SubcatchmentProperties";
import type { ScenarioDataRow } from "../layers/scenario";

function formatMass(kg: number): string {
  if (Math.abs(kg) >= 1000) return `${(kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} t`;
  return `${kg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`;
}

function formatVolume(m3: number): string {
  return `${m3.toLocaleString(undefined, { maximumFractionDigits: 2 })} m³`;
}

/**
 * Build the HTML tooltip for a subcatchment hillslope.
 */
export function buildHillslopeTooltip(
  props: Partial<SubcatchmentProperties>,
  scenarioRow?: ScenarioDataRow | null,
): string {
  const lines: string[] = [
    `<strong>Hillslope ID</strong>`,
    `TopazID: ${props.topazid ?? "N/A"}, WeppID: ${props.weppid ?? "N/A"}`,
  ];

  if (scenarioRow) {
    lines.push(
      `<strong>Runoff Volume:</strong> ${formatVolume(scenarioRow.runoff)}`,
      `<strong>Soil Loss:</strong> ${formatMass(scenarioRow.soil_loss)}`,
      `<strong>Sediment Deposition:</strong> ${formatMass(scenarioRow.sediment_deposition)}`,
      `<strong>Sediment Yield:</strong> ${formatMass(scenarioRow.sediment_yield)}`,
      `<strong>Area:</strong> ${scenarioRow.hillslope_area.toFixed(2)} ha`,
    );
  } else {
    lines.push(
      `<strong>Width:</strong> ${props.width?.toFixed(2) ?? "N/A"} m`,
      `<strong>Length:</strong> ${props.length?.toFixed(2) ?? "N/A"} m`,
      `<strong>Area:</strong> ${props.hillslope_area ?? "N/A"} m²`,
      `<strong>Slope:</strong> ${props.slope_scalar?.toFixed(2) ?? "N/A"}`,
      `<strong>Aspect:</strong> ${props.aspect?.toFixed(2) ?? "N/A"}`,
      `<strong>Soil:</strong> ${props.simple_texture ?? "N/A"}`,
    );
  }

  return `<span class="tooltip-bold">${lines.join("<br/>")}</span>`;
}
