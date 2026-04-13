import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { fetchLanduse } from "../api/landuseApi";
import { useWatershed } from "../contexts/WatershedContext";
import type { LanduseMap } from "../api/types";

export function useLanduseDataOnly(runId: string | null) {
  const { layerDesired, isEffective } = useWatershed();
  const enabled = Boolean(layerDesired.landuse.enabled && runId);
  const landuseEffective = isEffective("landuse");

  const { data: landuseData = null, isLoading } = useQuery<LanduseMap>({
    queryKey: queryKeys.landuse.undisturbed(runId ?? ""),
    queryFn: ({ signal }) => fetchLanduse({ runId: runId! }, signal),
    enabled,
  });

  const landuseLegendMap = useMemo(() => {
    if (
      !landuseEffective ||
      !landuseData ||
      Object.keys(landuseData).length === 0
    ) {
      return {} as Record<string, string>;
    }
    const legend: Record<string, string> = {};
    for (const { color, desc } of Object.values(landuseData)) {
      if (color && desc && !(color in legend)) {
        legend[color] = desc;
      }
    }
    return legend;
  }, [landuseEffective, landuseData]);

  return { landuseData, isLoading, landuseLegendMap, enabled };
}
