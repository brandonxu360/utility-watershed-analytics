/**
 * useRhessysChoroplethData — lightweight data-only hook for the
 * RHESSys dynamic choropleth (Gate Creek).
 *
 * Fetches the aggregated output rows and geometry, and computes the
 * robust value range.  Does NOT build the heavy dataMap or getStyle
 * callback — those live in useRhessysChoropleth.
 *
 * useChoroplethLegend uses this hook directly so it avoids the
 * expensive derivations it doesn't need.
 */

import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRunId } from "./useRunId";
import { queryKeys } from "../api/queryKeys";
import { useWatershed } from "../contexts/WatershedContext";
import { getLayerParams } from "../layers/types";
import {
  fetchRhessysChoropleth,
  fetchRhessysGeometry,
} from "../api/rhessysOutputsApi";
import {
  getPatchGeometryQueryScenario,
  getPatchGeometryRevision,
} from "../api/rhessys/utils";
import { computeRobustRange } from "../utils/colormap";

export function useRhessysChoroplethData() {
  const runId = useRunId();

  const { layerDesired, isEffective } = useWatershed();
  const params = getLayerParams(layerDesired, "rhessysOutputs");
  const isActive =
    isEffective("rhessysOutputs") && params.mode === "choropleth";

  const scenario = params.scenario;
  const variable = params.variable;
  const spatialScale = params.spatialScale ?? "hillslope";
  const year = params.year;

  const shouldQuery = isActive && !!runId && !!scenario && !!variable && !!year;

  const { data: rawData, isLoading: dataLoading } = useQuery({
    queryKey: queryKeys.rhessysChoropleth.byParams(
      runId ?? "",
      scenario!,
      variable!,
      spatialScale,
      year!,
    ),
    queryFn: ({ signal }) =>
      fetchRhessysChoropleth({
        runId: runId!,
        scenario: scenario!,
        variable: variable!,
        spatialScale,
        year: year!,
        signal,
      }),
    enabled: shouldQuery,
    placeholderData: keepPreviousData,
  });

  const patchGeometryRevision = getPatchGeometryRevision(spatialScale, scenario);
  const geometryQueryScenario = getPatchGeometryQueryScenario(
    patchGeometryRevision,
  );

  const { data: geometry, isLoading: geomLoading } = useQuery({
    queryKey: queryKeys.rhessysGeometry.byScale(
      runId ?? "",
      spatialScale,
      patchGeometryRevision,
    ),
    queryFn: ({ signal }) =>
      fetchRhessysGeometry(
        runId!,
        spatialScale,
        signal,
        geometryQueryScenario,
      ),
    enabled: isActive && !!runId,
    placeholderData: keepPreviousData,
  });

  const isLoading = dataLoading || geomLoading;

  const range = useMemo(() => {
    if (!rawData || rawData.length === 0) return null;
    const values = rawData.map((row) => row.value);
    return computeRobustRange(values, 0.0, 1.0);
  }, [rawData]);

  return {
    isActive,
    isLoading,
    rawData: rawData ?? null,
    geometry: geometry ?? null,
    range,
    spatialScale,
  };
}
