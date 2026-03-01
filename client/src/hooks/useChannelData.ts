/**
 * useChannelData — colocates channel fetching and runtime reporting.
 *
 * Responsibilities:
 *  1. `useQuery` for channel GeoJSON (gated on `layerDesired.channels.enabled`)
 *  2. Reports data-availability and loading to layer runtime via `useLayerQuery`
 */

import { useQuery } from "@tanstack/react-query";
import { fetchChannels } from "../api/api";
import { useWatershed } from "../contexts/WatershedContext";
import { useLayerQuery } from "./useLayerQuery";

export interface UseChannelDataResult {
  /** Channel GeoJSON FeatureCollection (or undefined while loading). */
  channelData: unknown;
  /** Whether the query is currently in-flight. */
  channelLoading: boolean;
}

export function useChannelData(runId: string | null): UseChannelDataResult {
  const { layerDesired } = useWatershed();

  const channelsEnabled = layerDesired.channels.enabled;

  // ── Fetch ─────────────────────────────────────────────────────────────
  const {
    data: channelData,
    isLoading: channelLoading,
    isError: channelError,
  } = useQuery({
    queryKey: ["channels", runId],
    queryFn: () => fetchChannels(runId!),
    enabled: Boolean(channelsEnabled && runId),
  });

  // ── Report data availability & loading ────────────────────────────────
  useLayerQuery("channels", {
    enabled: Boolean(channelsEnabled && runId),
    isLoading: channelLoading,
    hasData: !channelError && (channelData?.features?.length ?? 0) > 0,
  });

  return { channelData, channelLoading };
}
