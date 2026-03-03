import type { SubcatchmentProperties } from "../types/SubcatchmentProperties";
import type { ScenarioDataRow } from "../layers/scenario";

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
            `<strong>Runoff Volume:</strong> ${scenarioRow.runoff.toFixed(2)} mm`,
            `<strong>Soil Loss:</strong> ${scenarioRow.soil_loss.toFixed(2)} kg/m²`,
            `<strong>Sediment Deposition:</strong> ${scenarioRow.sediment_deposition.toFixed(2)} kg/m²`,
            `<strong>Sediment Yield:</strong> ${scenarioRow.sediment_yield.toFixed(2)} kg/m²`,
            `<strong>Area:</strong> ${scenarioRow.hillslope_area.toFixed(2)} m²`,
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
