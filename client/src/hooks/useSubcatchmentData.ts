import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { fetchSubcatchments } from "../api/api";
import { useWatershed } from "../contexts/WatershedContext";
import { useLayerQuery } from "./useLayerQuery";

export interface UseSubcatchmentDataResult {
  subcatchments: GeoJSON.FeatureCollection | undefined;
  subLoading: boolean;
}

export function useSubcatchmentData(
  runId: string | null,
): UseSubcatchmentDataResult {
  const { layerDesired } = useWatershed();
  const enabled = Boolean(layerDesired.subcatchment.enabled && runId);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.subcatchments.byRun(runId ?? ""),
    queryFn: ({ signal }) => fetchSubcatchments(runId!, signal),
    enabled,
  });

  useLayerQuery("subcatchment", {
    enabled,
    isLoading,
    hasData: !error && (data?.features?.length ?? 0) > 0,
    queryKey: queryKeys.subcatchments.all,
  });

  return { subcatchments: data ?? undefined, subLoading: isLoading };
}
