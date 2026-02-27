/**
 * Hook that derives effective layer state from desired + runtime.
 *
 * Uses the pure `evaluate()` function from the layer system, memoized
 * so it only recomputes when desired or runtime actually change.
 *
 * Returns the full EffectiveMap plus convenience selectors.
 */

import { useMemo } from "react";
import { useAppStore } from "../store/store";
import {
  evaluate,
  selectOrderedActiveIds,
  isDesiredButBlocked,
} from "../layers/evaluate";
import type { EffectiveMap, LayerId } from "../layers/types";

export interface UseEffectiveLayersResult {
  /** Complete effective state for all layers. */
  effective: EffectiveMap;
  /** Ordered list of layer IDs that are effectively enabled (by zIndex). */
  activeIds: LayerId[];
  /** Check if a specific layer is desired-on but blocked. */
  isBlocked: (id: LayerId) => boolean;
  /** Check if a specific layer is effectively enabled. */
  isEffective: (id: LayerId) => boolean;
}

export function useEffectiveLayers(): UseEffectiveLayersResult {
  const desired = useAppStore((s) => s.layerDesired);
  const runtime = useAppStore((s) => s.layerRuntime);

  const effective = useMemo(
    () => evaluate(desired, runtime),
    [desired, runtime],
  );

  const activeIds = useMemo(
    () => selectOrderedActiveIds(effective),
    [effective],
  );

  const isBlocked = useMemo(
    () => (id: LayerId) => isDesiredButBlocked(id, desired, effective),
    [desired, effective],
  );

  const isEffective = useMemo(
    () => (id: LayerId) => effective[id].enabled,
    [effective],
  );

  return { effective, activeIds, isBlocked, isEffective };
}
