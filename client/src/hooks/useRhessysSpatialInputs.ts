/**
 * useRhessysSpatialInputs — fetches the list of available RHESSys spatial
 * inputs for the current watershed and reports data availability into the
 * layer system.
 *
 * Returns the file list so the RHESSys section can populate its dropdown.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { fetchRhessysSpatialInputs } from "../api/rhessysApi";
import { useLayerQuery } from "./useLayerQuery";
import type { RhessysSpatialFile } from "../api/types";

export function useRhessysSpatialInputs(runId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.rhessysSpatialInputs.byRun(runId!),
    queryFn: () => fetchRhessysSpatialInputs(runId!),
    enabled: !!runId,
  });

  const files: RhessysSpatialFile[] = data?.files ?? [];
  const hasData = !error && files.length > 0;

  useLayerQuery("rhessysSpatial", {
    enabled: !!runId,
    isLoading,
    hasData,
  });

  return { files, isLoading };
}
