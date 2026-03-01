/**
 * useSubcatchmentData — colocates subcatchment fetching and runtime reporting.
 *
 * Responsibilities:
 *  1. `useQuery` for subcatchment GeoJSON (gated on `layerDesired.subcatchment.enabled`)
 *  2. Reports data-availability and loading to layer runtime via `useLayerQuery`
 */

import { useQuery } from "@tanstack/react-query";
import { fetchSubcatchments } from "../api/api";
import { useWatershed } from "../contexts/WatershedContext";
import { useLayerQuery } from "./useLayerQuery";

export interface UseSubcatchmentDataResult {
  /** Subcatchment GeoJSON FeatureCollection (or undefined while loading). */
  subcatchments: GeoJSON.FeatureCollection | undefined;
  /** Whether the query is currently in-flight. */
  subLoading: boolean;
}

export function useSubcatchmentData(
  runId: string | null,
): UseSubcatchmentDataResult {
  const { layerDesired } = useWatershed();

  const subcatchmentEnabled = layerDesired.subcatchment.enabled;

  // ── Fetch ─────────────────────────────────────────────────────────────
  const {
    data: subcatchments,
    isLoading: subLoading,
    isError: subError,
  } = useQuery({
    queryKey: ["subcatchments", runId],
    queryFn: () => fetchSubcatchments(runId!),
    enabled: Boolean(subcatchmentEnabled && runId),
  });

  // ── Report data availability & loading ────────────────────────────────
  useLayerQuery("subcatchment", {
    enabled: Boolean(subcatchmentEnabled && runId),
    isLoading: subLoading,
    hasData: !subError && (subcatchments?.features?.length ?? 0) > 0,
  });

  return { subcatchments, subLoading };
}
