import { queryKeys } from "../api/queryKeys";
import { fetchChannels } from "../api/api";
import { useWatershed } from "../contexts/WatershedContext";
import { useLayerData } from "./useLayerData";

export interface UseChannelDataResult {
  channelData: GeoJSON.FeatureCollection | undefined;
  channelLoading: boolean;
}

export function useChannelData(runId: string | null): UseChannelDataResult {
  const { layerDesired } = useWatershed();
  const enabled = Boolean(layerDesired.channels.enabled && runId);

  const { data, isLoading } = useLayerData(
    "channels",
    queryKeys.channels.byRun(runId ?? ""),
    (signal) => fetchChannels(runId!, signal),
    enabled,
    {
      hasDataFn: (d) => (d?.features?.length ?? 0) > 0,
      cancellationKey: queryKeys.channels.all,
    },
  );

  return { channelData: data ?? undefined, channelLoading: isLoading };
}
