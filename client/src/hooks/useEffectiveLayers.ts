/**
 * Hook that derives effective layer state from desired + runtime.
 *
 * Now delegates to WatershedContext which owns both desired and runtime
 * state and memoizes the evaluation internally.
 *
 * Returns the full EffectiveMap plus convenience selectors.
 */

import { useWatershed } from "../contexts/WatershedContext";
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
  const { effective, activeIds, isBlocked, isEffective } = useWatershed();
  return { effective, activeIds, isBlocked, isEffective };
}
