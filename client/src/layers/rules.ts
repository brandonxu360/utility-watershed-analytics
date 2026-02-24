/**
 * Pure state-transition functions for the layer system.
 *
 * Every function in this module is a pure function:
 *   (currentDesired, action) → nextDesired
 *
 * No side effects, no store access, no React — trivially unit-testable.
 *
 * This replaces the scattered toggle logic that was previously spread across
 * DataLayers.tsx handleChange, DataLayersTabContent.tsx inline onClick,
 * and sharedActionsSlice resetOverlays.
 */

import type { LayerId, LayerAction, DesiredMap, LayerDesiredState } from "./types";
import {
  LAYER_REGISTRY,
  getDescriptor,
  getGroup,
  getLayersInGroup,
  getDependents,
} from "./registry";

// ── Initial state (derived from registry — can never drift) ─────────────────

function buildInitialDesired(): DesiredMap {
  const map = {} as DesiredMap;
  for (const [id, desc] of Object.entries(LAYER_REGISTRY)) {
    map[id as LayerId] = {
      enabled: false,
      opacity: desc.defaults.opacity,
      params: { ...desc.defaults.params },
    };
  }
  return map;
}

/** Default desired state for every layer. Use for resets. */
export const INITIAL_DESIRED: DesiredMap = buildInitialDesired();

/** Default runtime state. */
export const INITIAL_RUNTIME = {
  zoom: 7, // matches WatershedMap's default center zoom
  dataAvailability: {} as Partial<Record<LayerId, boolean>>,
  loading: {} as Partial<Record<LayerId, boolean>>,
};

// ── Action dispatcher ───────────────────────────────────────────────────────

/**
 * Apply a `LayerAction` to the current desired state and return the next state.
 *
 * This is the **only** function that should modify desired state — all
 * interaction rules (requires, exclusive groups, dependent teardown) are
 * enforced here.
 */
export function applyAction(current: DesiredMap, action: LayerAction): DesiredMap {
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

    case "RESET":
      return buildInitialDesired();
  }
}

// ── Toggle logic ────────────────────────────────────────────────────────────

/**
 * Toggle a layer on or off, enforcing:
 *  1. `requires`        → auto-enable prerequisite layers
 *  2. exclusive groups  → auto-disable siblings in the same exclusive group
 *  3. dependent teardown → auto-disable layers that require the one being disabled
 */
function applyToggle(current: DesiredMap, id: LayerId, on: boolean): DesiredMap {
  const next: DesiredMap = { ...current };
  const desc = getDescriptor(id);

  // Clone the target layer's state
  next[id] = { ...current[id], enabled: on };

  if (on) {
    // ① Enable required layers (e.g. enabling landuse → enable subcatchment)
    for (const reqId of desc.requires ?? []) {
      if (!next[reqId].enabled) {
        next[reqId] = { ...next[reqId], enabled: true };
      }
    }

    // ② Enforce exclusive group (e.g. enabling landuse → disable choropleth & sbs)
    const group = getGroup(desc.group);
    if (group.type === "exclusive") {
      for (const sibling of getLayersInGroup(desc.group)) {
        if (sibling.id !== id && next[sibling.id].enabled) {
          next[sibling.id] = { ...next[sibling.id], enabled: false };
        }
      }
    }
  } else {
    // ③ Disable dependents (e.g. disabling subcatchment → disable landuse & choropleth)
    for (const depId of getDependents(id)) {
      if (next[depId].enabled) {
        next[depId] = { ...next[depId], enabled: false };
      }
    }
  }

  return next;
}

// ── Helpers for common multi-field updates ───────────────────────────────────

/**
 * Convenience: set a param and optionally enable the layer + its requirements
 * in one shot. Useful for "click Vegetation Cover button" which both enables
 * choropleth and sets metric param.
 */
export function enableWithParams(
  current: DesiredMap,
  id: LayerId,
  params: Record<string, unknown>,
): DesiredMap {
  // First set the params
  let next = { ...current };
  next[id] = {
    ...next[id],
    params: { ...next[id].params, ...params },
  };
  // Then toggle on (which enforces requires/exclusives)
  return applyToggle(next, id, true);
}
