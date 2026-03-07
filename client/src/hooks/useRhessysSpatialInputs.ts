/**
 * useRhessysSpatialInputs — fetches the list of available RHESSys spatial
 * inputs for the current watershed and reports data availability into the
 * layer system.
 *
 * Returns the file list so the RHESSys section can populate its dropdown.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchRhessysSpatialInputs } from "../api/rhessysApi";
import { useLayerQuery } from "./useLayerQuery";
import type { RhessysSpatialFile } from "../api/types";

export function useRhessysSpatialInputs(runId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["rhessysSpatialInputs", runId],
    queryFn: () => fetchRhessysSpatialInputs(runId!),
    enabled: !!runId,
    staleTime: 1000 * 60 * 30, // 30 min — discovery results rarely change
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
