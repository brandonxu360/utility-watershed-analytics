import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { PathOptions } from "leaflet";
import { useRunId } from "./useRunId";
import { useWatershed } from "../contexts/WatershedContext";
import { getLayerParams } from "../layers/types";
import { fetchScenarioData } from "../api/scenarioApi";
import { computeRobustRange } from "../utils/colormap";
import { useLayerQuery } from "./useLayerQuery";
import { useColormapStyle } from "./useColormapStyle";

import {
  type ScenarioDataRow,
  type ScenarioVariableType,
  SCENARIO_VARIABLE_CONFIG,
} from "../layers/scenario";

export interface UseScenarioDataResult {
  isLoading: boolean;
  hasData: boolean;
  range: { min: number; max: number } | null;
  variableConfig: { label: string; colormap: string; unit: string };
  getScenarioStyle: (weppid: number | undefined) => PathOptions | null;
  getScenarioRow: (weppid: number | undefined) => ScenarioDataRow | null;
}

export function useScenarioData(): UseScenarioDataResult {
  const runId = useRunId();
  const { layerDesired, isEffective } = useWatershed();
  const params = getLayerParams(layerDesired, "scenario");

  const selectedScenario = params.scenario ?? null;
  const scenarioVariable: ScenarioVariableType =
    params.variable ?? "sediment_yield";
  const scenarioEnabled = layerDesired.scenario.enabled;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.scenarioData.byScenario(
      runId ?? "",
      selectedScenario ?? "",
    ),
    queryFn: ({ signal }) =>
      fetchScenarioData({ runId: runId!, scenario: selectedScenario! }, signal),
    enabled: !!runId && !!selectedScenario && scenarioEnabled,
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

  const range = useMemo(() => {
    if (!hasData) return null;
    const values = Array.from(dataByWeppId.values()).map(
      (row) => row[scenarioVariable],
    );
    return computeRobustRange(values);
  }, [hasData, dataByWeppId, scenarioVariable]);

  const variableConfig = SCENARIO_VARIABLE_CONFIG[scenarioVariable];

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

  const numericMap = useMemo<Map<number, number> | null>(() => {
    if (!scenarioEffective || !hasData) return null;
    const m = new Map<number, number>();
    for (const [id, row] of dataByWeppId) {
      m.set(id, row[scenarioVariable]);
    }
    return m;
  }, [scenarioEffective, hasData, dataByWeppId, scenarioVariable]);

  const { getStyle } = useColormapStyle(
    numericMap,
    range,
    variableConfig.colormap,
  );

  const getScenarioStyle = useCallback(
    (weppid: number | undefined): PathOptions | null => {
      if (!scenarioEffective || !hasData || weppid === undefined) return null;
      return getStyle(weppid);
    },
    [scenarioEffective, hasData, getStyle],
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
