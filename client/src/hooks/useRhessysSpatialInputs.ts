import { queryKeys } from "../api/queryKeys";
import { fetchRhessysSpatialInputs } from "../api/rhessysApi";
import { useLayerData } from "./useLayerData";
import type { RhessysSpatialFile } from "../api/types";

type RhessysSpatialResponse = { files: RhessysSpatialFile[] };

export function useRhessysSpatialInputs(runId: string | null) {
  const { data, isLoading } = useLayerData<RhessysSpatialResponse>(
    "rhessysSpatial",
    queryKeys.rhessysSpatialInputs.byRun(runId ?? ""),
    (signal) => fetchRhessysSpatialInputs(runId!, signal),
    !!runId,
    {
      hasDataFn: (d) => (d?.files?.length ?? 0) > 0,
    },
  );

  return { files: data?.files ?? [], isLoading };
}
