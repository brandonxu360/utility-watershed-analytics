import { useMemo } from "react";
import { useWatershed } from "../contexts/WatershedContext";
import { useChoroplethData } from "./useChoroplethData";
import { useScenarioDataOnly } from "./useScenarioDataOnly";
import { useRhessysSpatialInputs } from "./useRhessysSpatialInputs";
import { useLanduseData } from "./useLanduseData";
import { useRhessysOutputsData } from "./useRhessysOutputsData";
import { useRhessysChoroplethData } from "./useRhessysChoroplethData";
import { getLayerParams } from "../layers/types";
import { useRunId } from "./useRunId";
import { GATE_CREEK_VARIABLES } from "../api/rhessys/constants";
import type { ChoroplethLegendProps } from "../components/map/controls/ChoroplethLegend";

/**
 * Derives the single choropleth legend to display on the map.
 *
 * Because `choropleth`, `scenario`, and `rhessysSpatial` belong to the
 * exclusive `coverageStyle` group, at most one is active at any time.
 * This hook checks each in priority order and returns the props for
 * `<ChoroplethLegend>`, or `null` when no legend should be shown.
 *
 * Data is sourced from the same hooks that WatershedMap uses.
 * React Query deduplicates the underlying network requests, and
 * `useRhessysOutputsData` (the data-only variant) avoids duplicate
 * layer-system side-effects.
 */
export function useChoroplethLegend(): ChoroplethLegendProps | null {
  const { isEffective, layerDesired } = useWatershed();

  const runId = useRunId();

  // Vegetation cover choropleth
  const {
    isActive: choroplethActive,
    isLoading: choroplethLoading,
    config: choroplethConfig,
    range: choroplethRange,
  } = useChoroplethData();

  // WEPP scenario
  const {
    hasData: hasScenarioData,
    range: scenarioRange,
    variableConfig: scenarioVarConfig,
  } = useScenarioDataOnly();

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

  // RHESSys outputs
  const rhessysOutputsEffective = isEffective("rhessysOutputs");
  const rhessysOutputsParams = getLayerParams(layerDesired, "rhessysOutputs");
  const {
    scenarios: outputScenarios,
    variables: outputVariables,
    valueRanges: outputValueRanges,
  } = useRhessysOutputsData(runId);

  // RHESSys dynamic choropleth
  const { isActive: rhessysChoroplethActive, range: rhessysChoroplethRange } =
    useRhessysChoroplethData();

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
      const scenarioId = selectedOutputScenario.id;
      const variableId = selectedOutputVariable.id;
      const valueRange = outputValueRanges[scenarioId]?.[variableId];

      // If we have actual value ranges from the backend, use them (skip if flat/all-zero raster)
      if (valueRange && valueRange.min !== valueRange.max) {
        return {
          title: `${selectedOutputVariable.label} \u2013 ${selectedOutputScenario.label}`,
          data: {
            mode: "colormap" as const,
            colormap: isChange ? "rdbu" : "viridis",
            range: valueRange,
            unit: selectedOutputVariable.units,
            percentile: false,
          },
        };
      }

      // Fallback to normalized 0-1 legend if no range data available or raster is flat
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
          percentile: false,
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
    outputValueRanges,
    rhessysChoroplethActive,
    rhessysChoroplethRange,
    rhessysOutputsParams.variable,
    rhessysOutputsParams.spatialScale,
    landuseEffective,
    landuseLegendMap,
  ]);
}
