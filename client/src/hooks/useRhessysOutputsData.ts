/**
 * useRhessysOutputsData — pure data hook for the RHESSys output catalog.
 *
 * Returns the query result without any layer-system side-effects.
 * Use this when you need the catalog data (scenarios, variables, value ranges)
 * without triggering `useLayerQuery` reporting — e.g. inside
 * `useChoroplethLegend` which resolves legend props from multiple layer hooks.
 *
 * For the full hook that also reports into the layer runtime, use
 * `useRhessysOutputs` instead.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";

import { fetchRhessysOutputs } from "../api/rhessysOutputsApi";

import type {
  RhessysOutputScenario,
  RhessysOutputVariable,
  RhessysOutputValueRange,
} from "../api/types";

import { CHOROPLETH_RUN_IDS } from "../api/rhessys/constants";

export function useRhessysOutputsData(runId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.rhessysOutputs.byRun(runId ?? ""),
    queryFn: ({ signal }) => fetchRhessysOutputs(runId!, signal),
    enabled: !!runId,
  });

  const scenarios: RhessysOutputScenario[] = data?.scenarios ?? [];
  const variables: RhessysOutputVariable[] = data?.variables ?? [];
  const valueRanges: Record<
    string,
    Record<string, RhessysOutputValueRange>
  > = data?.value_ranges ?? {};
  const hasRasterData = !error && scenarios.length > 0;
  const hasChoroplethData = CHOROPLETH_RUN_IDS.has(runId ?? "");

  return {
    scenarios,
    variables,
    valueRanges,
    isLoading,
    hasData: hasRasterData,
    hasChoroplethData,
  };
}
