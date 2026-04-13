import { useMemo, useCallback } from "react";
import { queryKeys } from "../api/queryKeys";
import { PathOptions } from "leaflet";
import { useRunId } from "./useRunId";
import { useWatershed } from "../contexts/WatershedContext";
import { useLayerQuery } from "./useLayerQuery";
import { useScenarioDataOnly } from "./useScenarioDataOnly";
import { useColormapStyle } from "./useColormapStyle";
import { type ScenarioDataRow } from "../layers/scenario";

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
