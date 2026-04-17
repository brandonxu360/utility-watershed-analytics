import { useMemo } from "react";
import { useWatershed } from "../contexts/WatershedContext";
import { useChoropleth, type CHOROPLETH_CONFIG } from "./useChoropleth";
import { useScenarioData } from "./useScenarioData";
import { useRhessysSpatialInputs } from "./useRhessysSpatialInputs";
import { useLanduseData } from "./useLanduseData";
import { useRhessysOutputsData } from "./useRhessysOutputsData";
import { useRhessysChoroplethData } from "./useRhessysChoroplethData";
import { getLayerParams } from "../layers/types";
import { useRunId } from "./useRunId";
import { GATE_CREEK_VARIABLES } from "../api/rhessys/constants";
import type { RhessysSpatialFile, SpatialScale } from "../api/types";

import type {
  ChoroplethLegendProps,
  ChoroplethLegendData,
} from "../components/map/controls/ChoroplethLegend";

import type {
  RhessysOutputScenario,
  RhessysOutputVariable,
  RhessysOutputValueRange,
} from "../api/types";

function buildVegetationLegend(
  config: (typeof CHOROPLETH_CONFIG)[keyof typeof CHOROPLETH_CONFIG],
  range: { min: number; max: number },
): ChoroplethLegendProps {
  return {
    title: config.title,
    data: {
      mode: "colormap",
      colormap: config.colormap,
      range,
      unit: config.unit,
      percentile: false,
    },
  };
}

function buildScenarioLegend(
  varConfig: { label: string; colormap: string; unit: string },
  range: { min: number; max: number },
): ChoroplethLegendProps {
  return {
    title: varConfig.label,
    data: {
      mode: "colormap",
      colormap: varConfig.colormap,
      range,
      unit: varConfig.unit,
      percentile: true,
    },
  };
}

function buildSpatialLegend(file: RhessysSpatialFile): ChoroplethLegendProps {
  const data: ChoroplethLegendData =
    file.type === "categorical" || file.type === "stream"
      ? { mode: "categorical", entries: file.legend! }
      : { mode: "stops", stops: file.legend! };
  return { title: file.name, data };
}

function buildOutputsLegend(
  scenario: RhessysOutputScenario,
  variable: RhessysOutputVariable,
  valueRanges: Record<string, Record<string, RhessysOutputValueRange>>,
): ChoroplethLegendProps {
  const isChange = scenario.is_change;
  const valueRange = valueRanges[scenario.id]?.[variable.id];
  const title = `${variable.label} \u2013 ${scenario.label}`;

  if (valueRange && valueRange.min !== valueRange.max) {
    return {
      title,
      data: {
        mode: "colormap",
        colormap: isChange ? "rdbu" : "viridis",
        range: valueRange,
        unit: variable.units,
        percentile: false,
      },
    };
  }

  // Fallback: normalized 0-1 stops when range is unavailable or flat
  return {
    title,
    data: {
      mode: "stops",
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

function buildGateCreekLegend(
  variable: string | null | undefined,
  spatialScale: string | null | undefined,
  range: { min: number; max: number },
): ChoroplethLegendProps {
  const scale: SpatialScale =
    spatialScale === "hillslope" || spatialScale === "patch"
      ? spatialScale
      : "hillslope";
  const gateCreekVars = GATE_CREEK_VARIABLES[scale] ?? [];
  const gcVar = gateCreekVars.find((v) => v.id === variable);
  return {
    title: gcVar?.label ?? variable ?? "RHESSys Output",
    data: {
      mode: "colormap",
      colormap: "viridis",
      range,
      unit: gcVar?.units ?? "",
      percentile: false,
    },
  };
}

function buildLanduseLegend(
  legendMap: Record<string, string>,
): ChoroplethLegendProps {
  return {
    title: "Land Use",
    data: {
      mode: "categorical",
      entries: Object.entries(legendMap).map(([color, desc]) => ({
        hex: color,
        value: desc,
      })),
    },
  };
}

export function useChoroplethLegend(): ChoroplethLegendProps | null {
  const { isEffective, layerDesired } = useWatershed();
  const runId = useRunId();

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

  // RHESSys spatial inputs
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

  // RHESSys outputs (pre-computed rasters)
  const rhessysOutputsEffective = isEffective("rhessysOutputs");
  const rhessysOutputsParams = getLayerParams(layerDesired, "rhessysOutputs");
  const {
    scenarios: outputScenarios,
    variables: outputVariables,
    valueRanges: outputValueRanges,
  } = useRhessysOutputsData(runId);
  const selectedOutputScenario = useMemo(
    () => outputScenarios.find((s) => s.id === rhessysOutputsParams.scenario),
    [outputScenarios, rhessysOutputsParams.scenario],
  );
  const selectedOutputVariable = useMemo(
    () => outputVariables.find((v) => v.id === rhessysOutputsParams.variable),
    [outputVariables, rhessysOutputsParams.variable],
  );

  // RHESSys dynamic choropleth (Gate Creek)
  const { isActive: rhessysChoroplethActive, range: rhessysChoroplethRange } =
    useRhessysChoroplethData();

  // Land use
  const { landuseLegendMap } = useLanduseData(runId);
  const landuseEffective = isEffective("landuse");

  return useMemo((): ChoroplethLegendProps | null => {
    type Provider = { active: boolean; props: ChoroplethLegendProps | null };

    const providers: Provider[] = [
      {
        active:
          choroplethActive &&
          !choroplethLoading &&
          choroplethConfig != null &&
          choroplethRange != null,
        props:
          choroplethConfig && choroplethRange
            ? buildVegetationLegend(choroplethConfig, choroplethRange)
            : null,
      },
      {
        active: scenarioEffective && hasScenarioData && scenarioRange != null,
        props: scenarioRange
          ? buildScenarioLegend(scenarioVarConfig, scenarioRange)
          : null,
      },
      {
        active:
          rhessysSpatialEffective &&
          selectedRhessysFile?.legend != null &&
          selectedRhessysFile.legend.length > 0,
        props: selectedRhessysFile?.legend?.length
          ? buildSpatialLegend(selectedRhessysFile)
          : null,
      },
      {
        active:
          rhessysOutputsEffective &&
          selectedOutputScenario != null &&
          selectedOutputVariable != null,
        props:
          selectedOutputScenario && selectedOutputVariable
            ? buildOutputsLegend(
                selectedOutputScenario,
                selectedOutputVariable,
                outputValueRanges,
              )
            : null,
      },
      {
        active: rhessysChoroplethActive && rhessysChoroplethRange != null,
        props: rhessysChoroplethRange
          ? buildGateCreekLegend(
              rhessysOutputsParams.variable,
              rhessysOutputsParams.spatialScale,
              rhessysChoroplethRange,
            )
          : null,
      },
      {
        active: landuseEffective && Object.keys(landuseLegendMap).length > 0,
        props: Object.keys(landuseLegendMap).length
          ? buildLanduseLegend(landuseLegendMap)
          : null,
      },
    ];

    return providers.find((p) => p.active && p.props != null)?.props ?? null;
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
