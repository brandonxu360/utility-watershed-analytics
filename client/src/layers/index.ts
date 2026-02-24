/**
 * Barrel export for the layer system.
 *
 * Import from "layers" rather than individual files:
 *   import { LAYER_REGISTRY, applyAction, evaluate } from "../layers";
 */

// Types
export type {
  LayerId,
  GroupId,
  GroupType,
  GroupDescriptor,
  LayerKind,
  LayerPane,
  LayerDescriptor,
  LayerDesiredState,
  DesiredMap,
  LayerRuntime,
  BlockedReason,
  LayerEffectiveState,
  EffectiveMap,
  LayerAction,
} from "./types";

export { ALL_LAYER_IDS } from "./types";

// Registry
export {
  LAYER_GROUPS,
  LAYER_REGISTRY,
  getDescriptor,
  getGroup,
  getLayersInGroup,
  getDependents,
} from "./registry";

// Rules (state transitions)
export {
  INITIAL_DESIRED,
  INITIAL_RUNTIME,
  applyAction,
  enableWithParams,
} from "./rules";

// Evaluator (desired + runtime → effective)
export {
  evaluate,
  selectOrderedActiveIds,
  isDesiredButBlocked,
} from "./evaluate";
