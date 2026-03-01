/**
 * useLanduseData — colocates landuse fetching, runtime reporting, and legend
 * computation in a single hook.
 *
 * Responsibilities:
 *  1. `useQuery` for landuse data (gated on `layerDesired.landuse.enabled`)
 *  2. Reports data-availability to layer runtime
 *  3. Reports loading flag to layer runtime
 *  4. Derives the legend map (color → description) from raw data
 *
 * This keeps all landuse-specific side-effects out of WatershedMap.
 */

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLanduse } from "../api/landuseApi";
import { useWatershed } from "../contexts/WatershedContext";
import type { LanduseMap } from "../api/types";

export interface UseLanduseDataResult {
  /** Raw landuse lookup (topazid → { desc, color }). */
  landuseData: LanduseMap | undefined;
  /** Whether the query is currently in-flight. */
  landuseLoading: boolean;
  /** Derived legend: color hex → description string. */
  landuseLegendMap: Record<string, string>;
}

export function useLanduseData(runId: string | null): UseLanduseDataResult {
  const { layerDesired, setDataAvailability, setLayerLoading, isEffective } =
    useWatershed();

  const landuseEnabled = layerDesired.landuse.enabled;
  const landuseEffective = isEffective("landuse");

  // ── Fetch ─────────────────────────────────────────────────────────────
  const {
    data: landuseData,
    isLoading: landuseLoading,
    error: landuseError,
  } = useQuery({
    queryKey: ["landuse-undisturbed", runId],
    queryFn: () => fetchLanduse({ runId: runId! }),
    enabled: Boolean(landuseEnabled && runId),
  });

  // ── Report data availability ──────────────────────────────────────────
  useEffect(() => {
    if (!runId || !landuseEnabled) return;

    if (landuseLoading) {
      setDataAvailability("landuse", undefined);
      return;
    }

    const hasData =
      !landuseError &&
      landuseData != null &&
      Object.keys(landuseData).length > 0;
    setDataAvailability("landuse", hasData);
  }, [
    landuseEnabled,
    landuseData,
    landuseLoading,
    landuseError,
    runId,
    setDataAvailability,
  ]);

  // ── Report loading flag ───────────────────────────────────────────────
  useEffect(() => {
    setLayerLoading("landuse", landuseLoading);
  }, [landuseLoading, setLayerLoading]);

  // ── Derive legend map ─────────────────────────────────────────────────
  const landuseLegendMap = useMemo(() => {
    if (
      !landuseEffective ||
      !landuseData ||
      Object.keys(landuseData).length === 0
    ) {
      return {};
    }

    const legend: Record<string, string> = {};
    for (const { color, desc } of Object.values(landuseData)) {
      if (color && desc && !(color in legend)) {
        legend[color] = desc;
      }
    }
    return legend;
  }, [landuseEffective, landuseData]);

  return { landuseData, landuseLoading, landuseLegendMap };
}
