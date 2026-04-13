import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { fetchChannels } from "../api/api";
import { useWatershed } from "../contexts/WatershedContext";
import { useLayerQuery } from "./useLayerQuery";

export interface UseChannelDataResult {
  channelData: GeoJSON.FeatureCollection | undefined;
  channelLoading: boolean;
}

export function useChannelData(runId: string | null): UseChannelDataResult {
  const { layerDesired } = useWatershed();
  const enabled = Boolean(layerDesired.channels.enabled && runId);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.channels.byRun(runId ?? ""),
    queryFn: ({ signal }) => fetchChannels(runId!, signal),
    enabled,
  });

  useLayerQuery("channels", {
    enabled,
    isLoading,
    hasData: !error && (data?.features?.length ?? 0) > 0,
    queryKey: queryKeys.channels.all,
  });

  return { channelData: data ?? undefined, channelLoading: isLoading };
}
