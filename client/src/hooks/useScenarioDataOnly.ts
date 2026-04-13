import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRunId } from "./useRunId";
import { useWatershed } from "../contexts/WatershedContext";
import { queryKeys } from "../api/queryKeys";
import { getLayerParams } from "../layers/types";
import { fetchScenarioData } from "../api/scenarioApi";
import { computeRobustRange } from "../utils/colormap";

import {
  type ScenarioDataRow,
  type ScenarioVariableType,
  SCENARIO_VARIABLE_CONFIG,
} from "../layers/scenario";

export interface UseScenarioDataOnlyResult {
  hasData: boolean;
  isLoading: boolean;
  range: { min: number; max: number } | null;
  variableConfig: { label: string; colormap: string; unit: string };
  dataByWeppId: Map<number, ScenarioDataRow>;
  scenarioVariable: ScenarioVariableType;
  scenarioEnabled: boolean;
  selectedScenario: string | null;
}

export function useScenarioDataOnly(): UseScenarioDataOnlyResult {
  const runId = useRunId();

  const { layerDesired } = useWatershed();
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

  return {
    hasData,
    isLoading,
    range,
    variableConfig,
    dataByWeppId,
    scenarioVariable,
    scenarioEnabled,
    selectedScenario,
  };
}
