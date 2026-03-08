import { useMemo } from "react";
import { useWatershed } from "../contexts/WatershedContext";
import { useChoropleth } from "./useChoropleth";
import { useScenarioData } from "./useScenarioData";
import { useRhessysSpatialInputs } from "./useRhessysSpatialInputs";
import { useLanduseData } from "./useLanduseData";
import { getLayerParams } from "../layers/types";
import { useParams } from "@tanstack/react-router";
import type { ChoroplethLegendProps } from "../components/map/controls/ChoroplethLegend";

/**
 * Derives the single choropleth legend to display on the map.
 *
 * Because `choropleth`, `scenario`, and `rhessysSpatial` belong to the
 * exclusive `coverageStyle` group, at most one is active at any time.
 * This hook checks each in priority order and returns the props for
 * `<ChoroplethLegend>`, or `null` when no legend should be shown.
 */
export function useChoroplethLegend(): ChoroplethLegendProps | null {
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
    landuseEffective,
    landuseLegendMap,
  ]);
}
