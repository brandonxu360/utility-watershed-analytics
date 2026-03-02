/**
 * Evaluator: desired + runtime → effective + blocked reasons.
 *
 * This replaces the two `useEffect` blocks in WatershedMap.tsx that silently
 * mutated store state when data was missing. Instead, desired state is never
 * touched by runtime conditions — evaluate() simply tells us what to *render*
 * and *why* something can't render.
 *
 * Pure function — no side effects, no store, no React.
 */

import type {
  LayerId,
  DesiredMap,
  EffectiveMap,
  LayerRuntime,
  LayerEffectiveState,
  BlockedReason,
  LayerDescriptor,
} from "./types";
import { LAYER_REGISTRY } from "./registry";

// ── Processing order ────────────────────────────────────────────────────────

/**
 * Return layer ids in dependency-safe order: layers without `requires` first,
 * then layers with `requires`. This guarantees that when we evaluate a layer's
 * "requires" constraint, its prerequisites have already been evaluated.
 *
 * If the dependency graph gets deeper than one level in the future, replace
 * this with a proper topological sort.
 */
function getProcessOrder(): LayerId[] {
  const entries = Object.entries(LAYER_REGISTRY) as [
    LayerId,
    LayerDescriptor,
  ][];
  const independent = entries
    .filter(([, d]) => !d.requires?.length)
    .map(([id]) => id);
  const dependent = entries
    .filter(([, d]) => d.requires?.length)
    .map(([id]) => id);
  return [...independent, ...dependent];
}

const PROCESS_ORDER: LayerId[] = getProcessOrder();

// ── Evaluator ───────────────────────────────────────────────────────────────

/**
 * Compute effective state for every layer.
 *
 * Rules applied per layer (only when `desired.enabled === true`):
 *
 * 1. **Data availability** — if the server returned 0 features/rows for this
 *    layer (`dataAvailability[id] === false`), the layer is blocked.
 *    Note: `undefined` means "not checked yet" and is NOT a block.
 *
 * 2. **Required layers** — if a prerequisite layer evaluated to
 *    `effective.enabled === false`, this layer is blocked.
 *
 * 3. **Zoom range** — if current zoom is outside the descriptor's
 *    `zoomRange`, the layer is blocked.
 *
 * The `loading` flag is purely informational — a loading layer is still
 * "effectively enabled" so the map can show a spinner or placeholder.
 */
export function evaluate(
  desired: DesiredMap,
  runtime: LayerRuntime,
): EffectiveMap {
  const effective = {} as EffectiveMap;

  for (const id of PROCESS_ORDER) {
    const desc = LAYER_REGISTRY[id];
    const d = desired[id];
    const reasons: BlockedReason[] = [];
    let enabled = d.enabled;

    if (enabled) {
      // 1. Check data availability (only blocks if explicitly false)
      if (runtime.dataAvailability[id] === false) {
        enabled = false;
        reasons.push({
          kind: "missing-data",
          detail: `${desc.label} data is not available`,
        });
      }

      // 2. Check required layers are effectively enabled
      for (const reqId of desc.requires ?? []) {
        const reqEffective = effective[reqId];
        if (reqEffective && !reqEffective.enabled) {
          enabled = false;
          reasons.push({ kind: "requires-layer", layerId: reqId });
        }
      }

      // 3. Check zoom range
      if (desc.zoomRange) {
        const z = runtime.zoom;
        if (z < desc.zoomRange.min || z > desc.zoomRange.max) {
          enabled = false;
          reasons.push({
            kind: "zoom-out-of-range",
            current: z,
            required: desc.zoomRange,
          });
        }
      }
    }

    effective[id] = {
      enabled,
      opacity: d.opacity,
      loading: runtime.loading[id] === true,
      blockedReasons: reasons,
    };
  }

  return effective;
}

// ── Derived helpers ─────────────────────────────────────────────────────────

/** Layer IDs that are effectively enabled, sorted by zIndex (ascending). */
export function selectOrderedActiveIds(effective: EffectiveMap): LayerId[] {
  return (Object.entries(effective) as [LayerId, LayerEffectiveState][])
    .filter(([, state]) => state.enabled)
    .sort(([a], [b]) => LAYER_REGISTRY[a].zIndex - LAYER_REGISTRY[b].zIndex)
    .map(([id]) => id);
}

/**
 * For a given layer, check whether the user wants it on but it can't render.
 * Useful for UI hints like "On (no data)" or "On (zoom in to see)".
 */
export function isDesiredButBlocked(
  id: LayerId,
  desired: DesiredMap,
  effective: EffectiveMap,
): boolean {
  return desired[id].enabled && !effective[id].enabled;
}
