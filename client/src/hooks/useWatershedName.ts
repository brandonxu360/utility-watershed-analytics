import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { fetchWatersheds } from "../api/api";
import { useRunId } from "./useRunId";
import { WatershedProperties } from "../types/WatershedProperties";

/**
 * Returns a filesystem-safe version of the current watershed's name.
 * Uses the same react-query cache key as WatershedOverview so there is
 * no extra network request when both are mounted.
 *
 * Falls back to the raw runId if the name is not yet available.
 */
export function useWatershedName(): string {
  const runId = useRunId();

  const { data: watersheds } = useQuery({
    queryKey: queryKeys.watersheds.all,
    queryFn: fetchWatersheds,
  });

  return useMemo(() => {
    const feature = watersheds?.features?.find(
      (f: GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>) =>
        f.id?.toString() === runId,
    );
    const name = feature?.properties?.pws_name ?? runId ?? "watershed";
    // Replace characters that are unsafe in filenames with underscores
    return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  }, [watersheds?.features, runId]);
}
