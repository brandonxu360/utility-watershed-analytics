/**
 * useRhessysOutputs — fetches the catalog of available RHESSys output map
 * products (pre-computed GeoTIFFs for Victoria + Mill Creek) and reports
 * data availability into the layer system.
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchRhessysOutputs,
  CHOROPLETH_RUN_IDS,
} from "../api/rhessysOutputsApi";
import { useLayerQuery } from "./useLayerQuery";
import type {
  RhessysOutputScenario,
  RhessysOutputVariable,
  RhessysOutputValueRange,
} from "../api/types";

export function useRhessysOutputs(
  runId: string | null,
  { reportLayerState = true } = {},
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["rhessysOutputs", runId],
    queryFn: () => fetchRhessysOutputs(runId!),
    enabled: !!runId,
    staleTime: 1000 * 60 * 30,
  });

  const scenarios: RhessysOutputScenario[] = data?.scenarios ?? [];
  const variables: RhessysOutputVariable[] = data?.variables ?? [];
  const valueRanges: Record<
    string,
    Record<string, RhessysOutputValueRange>
  > = data?.value_ranges ?? {};
  const hasRasterData = !error && scenarios.length > 0;
  const hasChoroplethData = CHOROPLETH_RUN_IDS.has(runId ?? "");

  useLayerQuery("rhessysOutputs", {
    enabled: reportLayerState && !!runId,
    isLoading,
    hasData: hasRasterData || hasChoroplethData,
  });

  return {
    scenarios,
    variables,
    valueRanges,
    isLoading,
    hasData: hasRasterData,
  };
}
