import type { ScenarioType, ScenarioVariableType } from "./scenario";

/**
 * Core type definitions for the declarative layer system.
 *
 * Concepts:
 *  - LayerId:           Every toggleable layer known to the app.
 *  - LayerDescriptor:   Static metadata about a layer (registry entry).
 *  - LayerDesiredState: What the *user* asked for (toggle on/off, opacity, params).
 *  - LayerRuntime:      Facts the app knows right now (zoom, data availability, loading).
 *  - LayerEffectiveState: What the map actually renders — derived from desired + runtime.
 *  - BlockedReason:     Why effective differs from desired (structured, never stringly-typed).
 */

export const ALL_LAYER_IDS = [
  "subcatchment",
  "channels",
  "patches",
  "landuse",
  "choropleth",
  "sbs",
  "fireSeverity",
  "scenario",
] as const;

export type LayerId = (typeof ALL_LAYER_IDS)[number];

export type GroupId =
  | "overlays" // multi-select: any number of layers can be enabled simultaneously.
  | "coverageStyle"; // exclusive: at most one layer in the group may be enabled.

export type GroupType = "multi" | "exclusive";

export interface GroupDescriptor {
  id: GroupId;
  label: string;
  type: GroupType;
}

export type LayerKind = "vector" | "raster";

/**
 * Leaflet pane where the layer should render.
 */
export type LayerPane = "overlayPane" | "rasterPane";

export interface LayerDescriptor {
  id: LayerId;
  label: string;
  group: GroupId;
  kind: LayerKind;
  pane: LayerPane;
  zIndex: number;
  requires?: LayerId[];
  zoomRange?: { min: number; max: number };
  defaults: {
    opacity: number;
    params: Record<string, unknown>;
  };
}

export interface ScenarioParams {
  scenario: ScenarioType | null;
  variable: ScenarioVariableType;
}

export interface ChoroplethParams {
  metric: "vegetationCover";
  year: number | null;
  bands: string;
}

export interface SbsParams {
  mode: "legacy" | "shift";
}

type EmptyParams = Record<string, never>;

export type LayerParamsMap = {
  subcatchment: EmptyParams;
  channels: EmptyParams;
  patches: EmptyParams;
  landuse: EmptyParams;
  choropleth: ChoroplethParams;
  sbs: SbsParams;
  fireSeverity: EmptyParams;
  scenario: ScenarioParams;
};

export interface LayerDesiredState {
  enabled: boolean;
  opacity: number;
  params: Record<string, unknown>;
}

export type DesiredMap = Record<LayerId, LayerDesiredState>;

export function getLayerParams<K extends LayerId>(
  map: DesiredMap,
  id: K,
): LayerParamsMap[K] {
  return map[id].params as LayerParamsMap[K];
}

export interface LayerRuntime {
  zoom: number;

  /**
   * Per-layer data availability facts.
   *  - `true`      → data fetched successfully with ≥1 feature/row
   *  - `false`     → fetch completed but dataset is empty / errored
   *  - `undefined` → not checked yet (layer hasn't been enabled)
   */
  dataAvailability: Partial<Record<LayerId, boolean>>;

  /**
   * Per-layer loading flags.
   *  - `true` → a fetch/query is in flight for this layer's data
   */
  loading: Partial<Record<LayerId, boolean>>;
}

/** Structured reason explaining why a layer's effective state differs from desired. */
export type BlockedReason =
  | { kind: "missing-data"; detail: string }
  | { kind: "requires-layer"; layerId: LayerId }
  | {
      kind: "zoom-out-of-range";
      current: number;
      required: { min: number; max: number };
    }
  | { kind: "excluded-by"; layerId: LayerId };

export interface LayerEffectiveState {
  /**
   * `true` → the layer should be rendered on the map.
   * Derived from desired + runtime constraints.
   */
  enabled: boolean;
  opacity: number;

  /**
   * `true` → data for this layer is currently being fetched.
   * Informational — does NOT block `enabled`.  The map may show a loading
   * overlay while this is true, and the actual layer component renders
   * once data arrives.
   */
  loading: boolean;

  /** Empty when effective matches desired; populated when enabled was forced to false. */
  blockedReasons: BlockedReason[];
}

export type EffectiveMap = Record<LayerId, LayerEffectiveState>;

export type LayerAction =
  | { type: "TOGGLE"; id: LayerId; on: boolean }
  | { type: "SET_OPACITY"; id: LayerId; opacity: number }
  | { type: "SET_PARAM"; id: LayerId; key: string; value: unknown }
  | { type: "ENABLE_WITH_PARAMS"; id: LayerId; params: Record<string, unknown> }
  | { type: "RESET" };
