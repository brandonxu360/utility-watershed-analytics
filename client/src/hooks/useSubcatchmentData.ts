/**
 * useSubcatchmentData — colocates subcatchment fetching and runtime reporting.
 *
 * Responsibilities:
 *  1. `useQuery` for subcatchment GeoJSON (gated on `layerDesired.subcatchment.enabled`)
 *  2. Reports data-availability to layer runtime
 *  3. Reports loading flag to layer runtime
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSubcatchments } from "../api/api";
import { useWatershed } from "../contexts/WatershedContext";

export interface UseSubcatchmentDataResult {
  /** Subcatchment GeoJSON FeatureCollection (or undefined while loading). */
  subcatchments: unknown;
  /** Whether the query is currently in-flight. */
  subLoading: boolean;
}

export function useSubcatchmentData(
  runId: string | null,
): UseSubcatchmentDataResult {
  const { layerDesired, setDataAvailability, setLayerLoading } = useWatershed();

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

  // ── Report data availability ──────────────────────────────────────────
  useEffect(() => {
    if (!runId || !subcatchmentEnabled) return;

    // Clear stale availability while a fresh fetch is in progress
    if (subLoading) {
      setDataAvailability("subcatchment", undefined);
      return;
    }

    const hasData = !subError && (subcatchments?.features?.length ?? 0) > 0;
    setDataAvailability("subcatchment", hasData);
  }, [
    subcatchmentEnabled,
    subLoading,
    subError,
    subcatchments,
    runId,
    setDataAvailability,
  ]);

  // ── Report loading flag ───────────────────────────────────────────────
  useEffect(() => {
    setLayerLoading("subcatchment", subLoading);
  }, [subLoading, setLayerLoading]);

  return { subcatchments, subLoading };
}
