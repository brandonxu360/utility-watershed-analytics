import { queryKeys } from "../api/queryKeys";
import { fetchSubcatchments } from "../api/api";
import { useWatershed } from "../contexts/WatershedContext";
import { useLayerData } from "./useLayerData";

export interface UseSubcatchmentDataResult {
  subcatchments: GeoJSON.FeatureCollection | undefined;
  subLoading: boolean;
}

export function useSubcatchmentData(
  runId: string | null,
): UseSubcatchmentDataResult {
  const { layerDesired } = useWatershed();
  const enabled = Boolean(layerDesired.subcatchment.enabled && runId);

  const { data, isLoading } = useLayerData(
    "subcatchment",
    queryKeys.subcatchments.byRun(runId ?? ""),
    (signal) => fetchSubcatchments(runId!, signal),
    enabled,
    {
      hasDataFn: (d) => (d?.features?.length ?? 0) > 0,
      cancellationKey: queryKeys.subcatchments.all,
    },
  );

  return { subcatchments: data ?? undefined, subLoading: isLoading };
}
