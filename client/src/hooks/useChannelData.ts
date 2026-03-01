/**
 * useChannelData — colocates channel fetching and runtime reporting.
 *
 * Responsibilities:
 *  1. `useQuery` for channel GeoJSON (gated on `layerDesired.channels.enabled`)
 *  2. Reports data-availability to layer runtime
 *  3. Reports loading flag to layer runtime
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchChannels } from "../api/api";
import { useWatershed } from "../contexts/WatershedContext";

export interface UseChannelDataResult {
  /** Channel GeoJSON FeatureCollection (or undefined while loading). */
  channelData: unknown;
  /** Whether the query is currently in-flight. */
  channelLoading: boolean;
}

export function useChannelData(runId: string | null): UseChannelDataResult {
  const { layerDesired, setDataAvailability, setLayerLoading } = useWatershed();

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

  // ── Report data availability ──────────────────────────────────────────
  useEffect(() => {
    if (!runId || !channelsEnabled) return;

    // Clear stale availability while a fresh fetch is in progress
    if (channelLoading) {
      setDataAvailability("channels", undefined);
      return;
    }

    const hasData = !channelError && (channelData?.features?.length ?? 0) > 0;
    setDataAvailability("channels", hasData);
  }, [
    channelsEnabled,
    runId,
    channelData,
    channelLoading,
    channelError,
    setDataAvailability,
  ]);

  // ── Report loading flag ───────────────────────────────────────────────
  useEffect(() => {
    setLayerLoading("channels", channelLoading);
  }, [channelLoading, setLayerLoading]);

  return { channelData, channelLoading };
}
