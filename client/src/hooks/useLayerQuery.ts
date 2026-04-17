import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWatershed } from "../contexts/WatershedContext";
import type { LayerId } from "../layers/types";

export interface UseLayerQueryOpts {
  enabled: boolean;
  isLoading: boolean;
  hasData: boolean;
  queryKey?: readonly unknown[];
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
  const queryClient = useQueryClient();

  const { enabled, isLoading, hasData, queryKey } = opts;

  const prevEnabledRef = useRef(enabled);

  useEffect(() => {
    if (prevEnabledRef.current && !enabled && queryKey) {
      queryClient.cancelQueries({ queryKey });
    }
    prevEnabledRef.current = enabled;
  }, [enabled, queryKey, queryClient]);

  useEffect(() => {
    if (!enabled) return;

    if (isLoading) {
      setDataAvailability(id, undefined);
      return;
    }

    setDataAvailability(id, hasData);
  }, [id, enabled, isLoading, hasData, setDataAvailability]);

  useEffect(() => {
    setLayerLoading(id, isLoading);
  }, [id, isLoading, setLayerLoading]);
}
