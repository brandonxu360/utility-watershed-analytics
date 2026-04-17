import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { LAYER_REGISTRY } from "../layers/registry";
import type { EffectiveMap, DesiredMap } from "../layers/types";
import { ALL_LAYER_IDS } from "../layers/types";

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
