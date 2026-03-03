import { useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { PathOptions } from "leaflet";
import { useWatershed } from "../contexts/WatershedContext";
import { useLayerQuery } from "./useLayerQuery";
import { getLayerParams } from "../layers/types";
import { fetchScenarioData } from "../api/scenarioApi";

import {
  type ScenarioDataRow,
  SCENARIO_VARIABLE_CONFIG,
} from "../layers/scenario";

import {
  computeRobustRange,
  createColormap,
  normalizeValue,
  RGBAArray,
} from "../utils/colormap";

export interface UseScenarioDataResult {
  isLoading: boolean;
  hasData: boolean;
  getScenarioStyle: (weppid: number | undefined) => PathOptions | null;
}

/**
 * Hook to fetch scenario WEPP loss data.
 */
export function useScenarioData(): UseScenarioDataResult {
  const runId =
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null;

  const { layerDesired, isEffective, dispatchLayerAction } = useWatershed();
  const params = getLayerParams(layerDesired, "scenario");

  const selectedScenario = params.scenario ?? null;
  const scenarioVariable = params.variable ?? "sediment_yield";
  const scenarioEnabled = layerDesired.scenario.enabled;

  const { data, isLoading } = useQuery({
    queryKey: ["scenarioData", runId, selectedScenario],
    queryFn: () =>
      fetchScenarioData({ runId: runId!, scenario: selectedScenario! }),
    enabled: !!runId && !!selectedScenario && scenarioEnabled,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const dataByWeppId = useMemo(() => {
    const map = new Map<number, ScenarioDataRow>();
    if (data) {
      for (const row of data) map.set(row.wepp_id, row);
    }
    return map;
  }, [data]);

  const hasData = dataByWeppId.size > 0;

  useLayerQuery("scenario", {
    enabled: scenarioEnabled,
    isLoading,
    hasData,
  });

  // Auto-revert to "None" when the selected scenario has no data.
  // Deferred one tick so useLayerToasts can observe the blocked effective
  // state (desired=true, effective=false) and fire its toast before desired
  // is set back to false.
  useEffect(() => {
    if (!scenarioEnabled || isLoading || hasData || !selectedScenario) return;
    const id = setTimeout(() => {
      dispatchLayerAction({ type: "TOGGLE", id: "scenario", on: false });
    }, 0);
    return () => clearTimeout(id);
  }, [scenarioEnabled, isLoading, hasData, selectedScenario, dispatchLayerAction]);

  const range = useMemo(() => {
    if (!hasData) return null;
    const values = Array.from(dataByWeppId.values()).map(
      (row) => row[scenarioVariable],
    );
    return computeRobustRange(values);
  }, [hasData, dataByWeppId, scenarioVariable]);

  const variableConfig = SCENARIO_VARIABLE_CONFIG[scenarioVariable];

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

  return {
    isLoading,
    hasData,
    getScenarioStyle,
  };
}
