import { useLayerQuery } from "./useLayerQuery";
import { useRhessysOutputsData } from "./useRhessysOutputsData";

export function useRhessysOutputs(runId: string | null) {
  const result = useRhessysOutputsData(runId);

  useLayerQuery("rhessysOutputs", {
    enabled: !!runId,
    isLoading: result.isLoading,
    hasData: result.hasData || result.hasChoroplethData,
  });

  return result;
}
