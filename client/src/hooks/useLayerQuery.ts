/**
 * useLayerQuery — generic hook that encapsulates the repetitive
 * "report data-availability + loading to layer runtime" side-effects.
 *
 * Every layer data hook (channels, subcatchment, landuse, choropleth)
 * previously duplicated two useEffects to sync React Query state into
 * the WatershedContext runtime.  This hook centralises that pattern so
 * callers only need to supply a `hasData` derivation.
 *
 * Usage:
 *   useLayerQuery("channels", {
 *     enabled: channelsEnabled,
 *     isLoading: channelLoading,
 *     hasData: !channelError && (channelData?.features?.length ?? 0) > 0,
 *   });
 */

import { useEffect } from "react";
import { useWatershed } from "../contexts/WatershedContext";
import type { LayerId } from "../layers/types";

export interface UseLayerQueryOpts {
  /**
   * Whether the layer's query is currently gated on (i.e. the user toggled
   * it on AND any other preconditions like runId are met).
   * When false the hook does nothing — availability is not reported.
   */
  enabled: boolean;
  /** React Query's `isLoading` flag for the layer's query. */
  isLoading: boolean;
  /**
   * Whether the query resolved with meaningful data.
   * Only evaluated when `isLoading` is false.
   * Set to `false` when the query errored or returned empty results.
   */
  hasData: boolean;
}

/**
 * Sync a layer's React Query lifecycle into the WatershedContext runtime
 * (`dataAvailability` and `loading` fields consumed by `evaluate()`).
 *
 * Call this once per layer data hook — it replaces the two boilerplate
 * useEffects that were previously copy-pasted in every hook.
 */
export function useLayerQuery(id: LayerId, opts: UseLayerQueryOpts): void {
  const { setDataAvailability, setLayerLoading } = useWatershed();

  const { enabled, isLoading, hasData } = opts;

  // ── Report data availability ──────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    if (isLoading) {
      setDataAvailability(id, undefined);
      return;
    }

    setDataAvailability(id, hasData);
  }, [id, enabled, isLoading, hasData, setDataAvailability]);

  // ── Report loading flag ───────────────────────────────────────────────
  useEffect(() => {
    setLayerLoading(id, isLoading);
  }, [id, isLoading, setLayerLoading]);
}
