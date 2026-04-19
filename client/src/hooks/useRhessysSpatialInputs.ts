import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { fetchRhessysSpatialInputs } from "../api/rhessysApi";
import { useLayerQuery } from "./useLayerQuery";
import type { RhessysSpatialFile } from "../api/types/rhessys";

type RhessysSpatialResponse = { files: RhessysSpatialFile[] };

export function useRhessysSpatialInputs(runId: string | null) {
  const enabled = !!runId;

  const { data, isLoading, isError } = useQuery<RhessysSpatialResponse>({
    queryKey: queryKeys.rhessysSpatialInputs.byRun(runId ?? ""),
    queryFn: ({ signal }) => fetchRhessysSpatialInputs(runId!, signal),
    enabled,
  });

  const files = data?.files ?? [];

  useLayerQuery("rhessysSpatial", {
    enabled,
    isLoading,
    hasData: !isError && files.length > 0,
    queryKey: queryKeys.rhessysSpatialInputs.byRun(runId ?? ""),
  });

  return { files, isLoading };
}
