import { useMemo } from "react";
import { useWatershed } from "../contexts/WatershedContext";
import { useChoropleth } from "./useChoropleth";
import { useScenarioData } from "./useScenarioData";
import { useRhessysSpatialInputs } from "./useRhessysSpatialInputs";
import { useLanduseData } from "./useLanduseData";
import { getLayerParams } from "../layers/types";
import { useParams } from "@tanstack/react-router";
import type { ChoroplethLegendProps } from "../components/map/controls/ChoroplethLegend";
import { GATE_CREEK_VARIABLES } from "../api/rhessysOutputsApi";
import type {
  RhessysOutputScenario,
  RhessysOutputVariable,
} from "../api/types";

/**
 * State that the caller (WatershedMap) already holds from hooks it has
 * called.  Accepting these as params avoids duplicate hook invocations
 * (and therefore duplicate React Query subscriptions, dataMap builds,
 * and colormap allocations).
 */
export interface ChoroplethLegendExternalState {
  outputScenarios: RhessysOutputScenario[];
  outputVariables: RhessysOutputVariable[];
  rhessysChoroplethActive: boolean;
  rhessysChoroplethRange: { min: number; max: number } | null;
}

/**
 * Derives the single choropleth legend to display on the map.
 *
 * Because `choropleth`, `scenario`, and `rhessysSpatial` belong to the
 * exclusive `coverageStyle` group, at most one is active at any time.
 * This hook checks each in priority order and returns the props for
 * `<ChoroplethLegend>`, or `null` when no legend should be shown.
 */
export function useChoroplethLegend(
  external: ChoroplethLegendExternalState,
): ChoroplethLegendProps | null {
  const { isEffective, layerDesired } = useWatershed();

  const runId =
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null;

  // Vegetation cover choropleth
  const {
    isActive: choroplethActive,
    isLoading: choroplethLoading,
    config: choroplethConfig,
    range: choroplethRange,
  } = useChoropleth();

  // WEPP scenario
  const {
    hasData: hasScenarioData,
    range: scenarioRange,
    variableConfig: scenarioVarConfig,
  } = useScenarioData();
  const scenarioEffective = isEffective("scenario");

  // RHESSys spatial
  const rhessysSpatialEffective = isEffective("rhessysSpatial");
  const rhessysSpatialParams = getLayerParams(layerDesired, "rhessysSpatial");
  const { files: rhessysSpatialFiles } = useRhessysSpatialInputs(runId);
  const selectedRhessysFile = useMemo(
    () =>
      rhessysSpatialFiles.find(
        (f) => f.filename === rhessysSpatialParams.filename,
      ) ?? null,
    [rhessysSpatialFiles, rhessysSpatialParams.filename],
  );

  // RHESSys outputs — use caller-provided data to avoid duplicate hooks
  const rhessysOutputsEffective = isEffective("rhessysOutputs");
  const rhessysOutputsParams = getLayerParams(layerDesired, "rhessysOutputs");
  const {
    outputScenarios,
    outputVariables,
    rhessysChoroplethActive,
    rhessysChoroplethRange,
  } = external;

  const selectedOutputScenario = useMemo(
    () => outputScenarios.find((s) => s.id === rhessysOutputsParams.scenario),
    [outputScenarios, rhessysOutputsParams.scenario],
  );
  const selectedOutputVariable = useMemo(
    () => outputVariables.find((v) => v.id === rhessysOutputsParams.variable),
    [outputVariables, rhessysOutputsParams.variable],
  );

  // Land use
  const { landuseLegendMap } = useLanduseData(runId);
  const landuseEffective = isEffective("landuse");

  return useMemo((): ChoroplethLegendProps | null => {
    // Vegetation cover
    if (
      choroplethActive &&
      !choroplethLoading &&
      choroplethConfig &&
      choroplethRange
    ) {
      return {
        title: choroplethConfig.title,
        data: {
          mode: "colormap",
          colormap: choroplethConfig.colormap,
          range: choroplethRange,
          unit: choroplethConfig.unit,
          percentile: false,
        },
      };
    }

    // WEPP scenario
    if (scenarioEffective && hasScenarioData && scenarioRange) {
      return {
        title: scenarioVarConfig.label,
        data: {
          mode: "colormap",
          colormap: scenarioVarConfig.colormap,
          range: scenarioRange,
          unit: scenarioVarConfig.unit,
          percentile: true,
        },
      };
    }

    // RHESSys spatial input
    if (
      rhessysSpatialEffective &&
      selectedRhessysFile?.legend &&
      selectedRhessysFile.legend.length > 0
    ) {
      const file = selectedRhessysFile;
      return {
        title: file.name,
        data:
          file.type === "categorical" || file.type === "stream"
            ? { mode: "categorical", entries: file.legend! }
            : { mode: "stops", stops: file.legend! },
      };
    }

    // RHESSys outputs (pre-computed maps)
    if (
      rhessysOutputsEffective &&
      selectedOutputScenario &&
      selectedOutputVariable
    ) {
      const isChange = selectedOutputScenario.is_change;
      return {
        title: `${selectedOutputVariable.label} \u2013 ${selectedOutputScenario.label}`,
        data: {
          mode: "stops" as const,
          stops: isChange
            ? [
                { value: -1, hex: "#2166AC" },
                { value: 0, hex: "#F7F7F7" },
                { value: 1, hex: "#B2182B" },
              ]
            : [
                { value: 0, hex: "#440154" },
                { value: 0.5, hex: "#21918C" },
                { value: 1, hex: "#FDE725" },
              ],
        },
      };
    }

    // RHESSys dynamic choropleth (Gate Creek)
    if (rhessysChoroplethActive && rhessysChoroplethRange) {
      const variable = rhessysOutputsParams.variable;
      const scale = rhessysOutputsParams.spatialScale ?? "hillslope";
      const gateCreekVars = GATE_CREEK_VARIABLES[scale] ?? [];
      const gcVar = gateCreekVars.find((v) => v.id === variable);
      const varLabel = gcVar?.label ?? variable ?? "RHESSys Output";
      return {
        title: varLabel,
        data: {
          mode: "colormap" as const,
          colormap: "viridis",
          range: rhessysChoroplethRange,
          unit: gcVar?.units ?? "",
          percentile: true,
        },
      };
    }

    // Land use
    if (landuseEffective && Object.keys(landuseLegendMap).length > 0) {
      return {
        title: "Land Use",
        data: {
          mode: "categorical",
          entries: Object.entries(landuseLegendMap).map(([color, desc]) => ({
            hex: color,
            value: desc,
          })),
        },
      };
    }

    return null;
  }, [
    choroplethActive,
    choroplethLoading,
    choroplethConfig,
    choroplethRange,
    scenarioEffective,
    hasScenarioData,
    scenarioRange,
    scenarioVarConfig,
    rhessysSpatialEffective,
    selectedRhessysFile,
    rhessysOutputsEffective,
    selectedOutputScenario,
    selectedOutputVariable,
    rhessysChoroplethActive,
    rhessysChoroplethRange,
    rhessysOutputsParams.variable,
    rhessysOutputsParams.spatialScale,
    landuseEffective,
    landuseLegendMap,
  ]);
}
