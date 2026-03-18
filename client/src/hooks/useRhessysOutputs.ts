/**
 * useRhessysOutputs — fetches the catalog of available RHESSys output map
 * products (pre-computed GeoTIFFs for Victoria + Mill Creek) and reports
 * data availability into the layer system.
 *
 * Built on top of `useRhessysOutputsData` (pure query, no side-effects).
 */

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
