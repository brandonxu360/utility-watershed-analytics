import { queryKeys } from "../api/queryKeys";
import { useLayerQuery } from "./useLayerQuery";
import { useLanduseDataOnly } from "./useLanduseDataOnly";
import type { LanduseMap } from "../api/types";

export interface UseLanduseDataResult {
  landuseData: LanduseMap | undefined;
  landuseLoading: boolean;
  landuseLegendMap: Record<string, string>;
}

export function useLanduseData(runId: string | null): UseLanduseDataResult {
  const { landuseData, isLoading, landuseLegendMap, enabled } =
    useLanduseDataOnly(runId);

  useLayerQuery("landuse", {
    enabled,
    isLoading,
    hasData: landuseData != null && Object.keys(landuseData).length > 0,
    queryKey: queryKeys.landuse.undisturbed(runId ?? ""),
  });

  return {
    landuseData: landuseData ?? undefined,
    landuseLoading: isLoading,
    landuseLegendMap,
  };
}
