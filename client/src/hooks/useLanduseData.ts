import { useMemo } from "react";
import { queryKeys } from "../api/queryKeys";
import { fetchLanduse } from "../api/landuseApi";
import { useWatershed } from "../contexts/WatershedContext";
import { useLayerData } from "./useLayerData";
import type { LanduseMap } from "../api/types";

export interface UseLanduseDataResult {
  landuseData: LanduseMap | undefined;
  landuseLoading: boolean;
  landuseLegendMap: Record<string, string>;
}

export function useLanduseData(runId: string | null): UseLanduseDataResult {
  const { layerDesired, isEffective } = useWatershed();
  const enabled = Boolean(layerDesired.landuse.enabled && runId);
  const landuseEffective = isEffective("landuse");

  const { data: landuseData, isLoading: landuseLoading } = useLayerData(
    "landuse",
    queryKeys.landuse.undisturbed(runId ?? ""),
    (signal) => fetchLanduse({ runId: runId! }, signal),
    enabled,
    {
      hasDataFn: (d) => d != null && Object.keys(d).length > 0,
    },
  );

  const landuseLegendMap = useMemo(() => {
    if (
      !landuseEffective ||
      !landuseData ||
      Object.keys(landuseData).length === 0
    ) {
      return {};
    }

    const legend: Record<string, string> = {};
    for (const { color, desc } of Object.values(landuseData)) {
      if (color && desc && !(color in legend)) {
        legend[color] = desc;
      }
    }
    return legend;
  }, [landuseEffective, landuseData]);

  return {
    landuseData: landuseData ?? undefined,
    landuseLoading,
    landuseLegendMap,
  };
}
