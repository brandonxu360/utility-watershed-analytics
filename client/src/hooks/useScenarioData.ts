import { useMemo, useCallback } from "react";
import { queryKeys } from "../api/queryKeys";
import { PathOptions } from "leaflet";
import { useRunId } from "./useRunId";
import { useWatershed } from "../contexts/WatershedContext";
import { useLayerQuery } from "./useLayerQuery";
import { useScenarioDataOnly } from "./useScenarioDataOnly";

import { type ScenarioDataRow } from "../layers/scenario";

import { createColormap, normalizeValue, RGBAArray } from "../utils/colormap";

export interface UseScenarioDataResult {
  isLoading: boolean;
  hasData: boolean;
  range: { min: number; max: number } | null;
  variableConfig: { label: string; colormap: string; unit: string };
  getScenarioStyle: (weppid: number | undefined) => PathOptions | null;
  getScenarioRow: (weppid: number | undefined) => ScenarioDataRow | null;
}

/**
 * Hook to fetch scenario WEPP loss data.
 */
export function useScenarioData(): UseScenarioDataResult {
  const runId = useRunId();
  const { isEffective } = useWatershed();

  const {
    hasData,
    isLoading,
    range,
    variableConfig,
    dataByWeppId,
    scenarioVariable,
    scenarioEnabled,
    selectedScenario,
  } = useScenarioDataOnly();

  useLayerQuery("scenario", {
    enabled: scenarioEnabled,
    isLoading,
    hasData,
    queryKey: queryKeys.scenarioData.byScenario(
      runId ?? "",
      selectedScenario ?? "",
    ),
  });

  const scenarioEffective = isEffective("scenario");

  const scenarioColormap = useMemo<RGBAArray | null>(() => {
    if (!scenarioEffective || !range) return null;
    return createColormap({
      colormap: variableConfig.colormap,
      nshades: 256,
      format: "rgba",
    }) as RGBAArray;
  }, [scenarioEffective, range, variableConfig.colormap]);

  const getScenarioStyle = useCallback(
    (weppid: number | undefined): PathOptions | null => {
      if (
        !scenarioEffective ||
        !hasData ||
        !scenarioColormap ||
        !range ||
        weppid === undefined
      )
        return null;

      const row = dataByWeppId.get(weppid);
      if (!row) return null;

      const normalized = normalizeValue(
        row[scenarioVariable],
        range.min,
        range.max,
      );
      const colorIndex = Math.round(normalized * (scenarioColormap.length - 1));
      const [r, g, b] = scenarioColormap[colorIndex] || [128, 128, 128];
      return {
        color: "#2c2c2c",
        weight: 0.75,
        fillColor: `rgb(${r}, ${g}, ${b})`,
        fillOpacity: 0.85,
      };
    },
    [
      scenarioEffective,
      hasData,
      scenarioColormap,
      range,
      dataByWeppId,
      scenarioVariable,
    ],
  );

  const getScenarioRow = useCallback(
    (weppid: number | undefined): ScenarioDataRow | null => {
      if (!scenarioEffective || !hasData || weppid === undefined) return null;
      return dataByWeppId.get(weppid) ?? null;
    },
    [scenarioEffective, hasData, dataByWeppId],
  );

  return {
    isLoading,
    hasData,
    range,
    variableConfig,
    getScenarioStyle,
    getScenarioRow,
  };
}
