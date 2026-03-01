/**
 * Hook that fires toast notifications when layers become blocked.
 *
 * Replaces the scattered useEffect auto-disable toasts in WatershedMap.tsx.
 * Watches the effective state and shows a toast when a layer transitions
 * from "effectively enabled" to "blocked" — but only if the user desires it on.
 */

import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { LAYER_REGISTRY } from "../layers/registry";
import type { EffectiveMap, DesiredMap } from "../layers/types";
import { ALL_LAYER_IDS } from "../layers/types";

/**
 * Call this once in the map container. It tracks previous effective state
 * and fires toasts on transitions.
 */
export function useLayerToasts(desired: DesiredMap, effective: EffectiveMap) {
  const prevEffective = useRef<EffectiveMap | null>(null);
  const prevDesired = useRef<DesiredMap | null>(null);

  useEffect(() => {
    const prev = prevEffective.current;
    if (!prev) {
      // First render — record baseline, no toasts
      prevEffective.current = effective;
      prevDesired.current = desired;
      return;
    }

    for (const id of ALL_LAYER_IDS) {
      const wasEnabled = prev[id]?.enabled ?? false;
      const nowEnabled = effective[id].enabled;
      const userWantsIt = desired[id].enabled;

      const shouldToast =
        userWantsIt &&
        !nowEnabled &&
        // Case 1: was effectively enabled, now blocked
        (wasEnabled ||
          // Case 2: user just toggled this on but it was immediately blocked
          !prevDesired.current![id].enabled);

      if (shouldToast) {
        const reasons = effective[id].blockedReasons;
        if (reasons.length > 0) {
          const label = LAYER_REGISTRY[id].label;
          const reasonText = reasons
            .map((r) => {
              switch (r.kind) {
                case "missing-data":
                  return r.detail;
                case "requires-layer":
                  return `Requires ${LAYER_REGISTRY[r.layerId].label}`;
                case "zoom-out-of-range":
                  return `Visible at zoom ${r.required.min}–${r.required.max}`;
                case "excluded-by":
                  return `Excluded by ${LAYER_REGISTRY[r.layerId].label}`;
              }
            })
            .join("; ");
          toast.error(`${label}: ${reasonText}`);
        }
      }
    }

    prevEffective.current = effective;
    prevDesired.current = desired;
  }, [effective, desired]);
}
