/**
 * Pure state-transition functions for the layer system.
 *
 * Every function in this module is a pure function:
 *   (currentDesired, action) → nextDesired
 */

import type { LayerId, LayerAction, DesiredMap } from "./types";

import {
  LAYER_REGISTRY,
  getDescriptor,
  getGroup,
  getLayersInGroup,
  getDependents,
} from "./registry";

/** Layers that start enabled and are exempt from requirement teardown. */
const DEFAULT_ENABLED: ReadonlySet<LayerId> = new Set(
  (
    Object.entries(LAYER_REGISTRY) as [
      LayerId,
      (typeof LAYER_REGISTRY)[LayerId],
    ][]
  )
    .filter(([, desc]) => desc.defaults.enabled)
    .map(([id]) => id),
);

function buildInitialDesired(): DesiredMap {
  const map = {} as DesiredMap;
  for (const [id, desc] of Object.entries(LAYER_REGISTRY)) {
    map[id as LayerId] = {
      enabled: desc.defaults.enabled,
      opacity: desc.defaults.opacity,
      params: { ...desc.defaults.params },
    };
  }
  return map;
}

export const INITIAL_DESIRED: DesiredMap = buildInitialDesired();

export const INITIAL_RUNTIME = {
  zoom: 7, // matches WatershedMap's default center zoom
  dataAvailability: {} as Partial<Record<LayerId, boolean>>,
  loading: {} as Partial<Record<LayerId, boolean>>,
};

/**
 * Apply a `LayerAction` to the current desired state and return the next state.
 *
 * This is the **only** function that should modify desired state — all
 * interaction rules (requires, exclusive groups, dependent teardown) are
 * enforced here.
 */
export function applyAction(
  current: DesiredMap,
  action: LayerAction,
): DesiredMap {
  switch (action.type) {
    case "TOGGLE":
      return applyToggle(current, action.id, action.on);

    case "SET_OPACITY":
      return {
        ...current,
        [action.id]: { ...current[action.id], opacity: action.opacity },
      };

    case "SET_PARAM":
      return {
        ...current,
        [action.id]: {
          ...current[action.id],
          params: { ...current[action.id].params, [action.key]: action.value },
        },
      };

    case "ENABLE_WITH_PARAMS":
      return enableWithParams(current, action.id, action.params);

    case "RESET":
      return buildInitialDesired();
  }
}

/**
 * Disable a layer and clean up after it: cascade-disable its dependents,
 * then auto-disable its non-default-on requirements when no other enabled
 * layer still needs them.  Operates on `next` via replacement.
 */
function disableLayer(next: DesiredMap, id: LayerId): void {
  next[id] = { ...next[id], enabled: false };

  // Cascade: disable layers that require this one
  for (const depId of getDependents(id)) {
    if (next[depId].enabled) {
      next[depId] = { ...next[depId], enabled: false };
    }
  }

  // Teardown: disable non-default-on requirements no longer needed
  const desc = getDescriptor(id);
  for (const reqId of desc.requires ?? []) {
    if (DEFAULT_ENABLED.has(reqId)) continue;
    const stillNeeded = getDependents(reqId).some(
      (depId) => depId !== id && next[depId].enabled,
    );
    if (!stillNeeded && next[reqId].enabled) {
      next[reqId] = { ...next[reqId], enabled: false };
    }
  }
}

/**
 * Toggle a layer on or off, enforcing:
 *  1. `requires`        → auto-enable prerequisite layers
 *  2. exclusive groups  → auto-disable siblings in the same exclusive group
 *  3. dependent teardown → auto-disable layers that require the one being disabled
 */
function applyToggle(
  current: DesiredMap,
  id: LayerId,
  on: boolean,
): DesiredMap {
  const next: DesiredMap = { ...current };
  const desc = getDescriptor(id);

  // Clone the target layer's state
  next[id] = { ...current[id], enabled: on };

  if (on) {
    // Enable required layers (e.g. enabling landuse → enable subcatchment)
    for (const reqId of desc.requires ?? []) {
      if (!next[reqId].enabled) {
        next[reqId] = { ...next[reqId], enabled: true };
      }
    }

    // Enforce exclusive group (e.g. enabling landuse → disable choropleth & sbs)
    const group = getGroup(desc.group);
    if (group.type === "exclusive") {
      for (const sibling of getLayersInGroup(desc.group)) {
        if (sibling.id !== id && next[sibling.id].enabled) {
          disableLayer(next, sibling.id);
        }
      }
    }
  } else {
    disableLayer(next, id);
  }

  return next;
}

/**
 * Convenience: set a param and optionally enable the layer + its requirements
 * in one shot.
 */
export function enableWithParams(
  current: DesiredMap,
  id: LayerId,
  params: Record<string, unknown>,
): DesiredMap {
  const next = { ...current };
  next[id] = {
    ...next[id],
    params: { ...next[id].params, ...params },
  };

  return applyToggle(next, id, true);
}
