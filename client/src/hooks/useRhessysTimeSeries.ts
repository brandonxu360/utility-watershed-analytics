import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import {
  fetchRhessysTimeSeries,
  type RhessysTimeSeriesRow,
} from "../api/rhessysOutputsApi";

type SpatialScale = "hillslope" | "patch";

type ChartPoint = { name: string; value: number };

export type UseRhessysTimeSeriesOptions = {
  runId: string | null;
  scenario: string;
  variable: string;
  spatialScale: SpatialScale;
};

/**
 * Fetches RHESSys time series data and transforms it into chart-ready points.
 *
 * - Uses centralized query keys
 * - Passes React Query's signal through to postQuery for cancellation
 * - Uses `select` to map raw rows → `{ name, value }[]` so the component
 *   only receives render-ready data
 * - `placeholderData: keepPreviousData` keeps the previous chart visible
 *   while switching scenario/variable
 */
export function useRhessysTimeSeries(opts: UseRhessysTimeSeriesOptions) {
  const { runId, scenario, variable, spatialScale } = opts;
  const isYearly = spatialScale === "patch";

  return useQuery({
    queryKey: queryKeys.rhessysTimeSeries.byParams(
      runId ?? "",
      scenario,
      variable,
      spatialScale,
    ),
    queryFn: ({ signal }) =>
      fetchRhessysTimeSeries({
        runId: runId!,
        scenario,
        variables: [variable],
        spatialScale,
        signal,
      }),
    enabled: !!runId,
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
    select: (rows: RhessysTimeSeriesRow[]): ChartPoint[] =>
      rows.map((row) => ({
        name: isYearly
          ? String(row.year)
          : `${row.year}-${String(row.month).padStart(2, "0")}`,
        value: (row[variable] as number) ?? 0,
      })),
  });
}
