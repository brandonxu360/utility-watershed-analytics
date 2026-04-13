import { queryKeys } from "../api/queryKeys";
import { useLayerQuery } from "./useLayerQuery";
import { useRhessysSpatialData } from "./useRhessysSpatialData";

export function useRhessysSpatialInputs(runId: string | null) {
  const { files, isLoading } = useRhessysSpatialData(runId);
  const enabled = !!runId;

  useLayerQuery("rhessysSpatial", {
    enabled,
    isLoading,
    hasData: files.length > 0,
    queryKey: queryKeys.rhessysSpatialInputs.byRun(runId ?? ""),
  });

  return { files, isLoading };
}
