import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { fetchRhessysSpatialInputs } from "../api/rhessysApi";
import type { RhessysSpatialFile } from "../api/types";

type RhessysSpatialResponse = { files: RhessysSpatialFile[] };

export function useRhessysSpatialData(runId: string | null) {
  const { data, isLoading } = useQuery<RhessysSpatialResponse>({
    queryKey: queryKeys.rhessysSpatialInputs.byRun(runId ?? ""),
    queryFn: ({ signal }) => fetchRhessysSpatialInputs(runId!, signal),
    enabled: !!runId,
  });

  return { files: data?.files ?? [], isLoading };
}
