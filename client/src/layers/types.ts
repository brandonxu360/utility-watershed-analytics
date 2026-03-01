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

// ── Layer identifiers ──────────────────────────────────────────────────────

/** All layer ids as a const array (useful for iteration). */
export const ALL_LAYER_IDS = [
  "subcatchment",
  "channels",
  "patches",
  "landuse",
  "choropleth",
  "sbs",
  "fireSeverity",
] as const;

/** Every toggleable layer known to the system. */
export type LayerId = (typeof ALL_LAYER_IDS)[number];

// ── Group identifiers ──────────────────────────────────────────────────────

/** Named groups of layers. */
export type GroupId =
  | "overlays" // multi-select: subcatchment, channels, patches, fireSeverity
  | "coverageStyle"; // exclusive: landuse, choropleth, sbs

export type GroupType = "multi" | "exclusive";

export interface GroupDescriptor {
  id: GroupId;
  label: string;
  /** "multi"     → any number of layers can be enabled simultaneously.
   *  "exclusive" → at most one layer in the group may be enabled. */
  type: GroupType;
}

// ── Layer descriptors (registry entries) ────────────────────────────────────

export type LayerKind = "vector" | "raster";

/**
 * Leaflet pane where the layer should render.
 * Using custom panes ensures stable z-ordering independent of add-order.
 */
export type LayerPane = "overlayPane" | "rasterPane";

export interface LayerDescriptor {
  id: LayerId;
  label: string;
  group: GroupId;
  kind: LayerKind;
  pane: LayerPane;
  zIndex: number;

  /** Other layers that MUST be enabled for this layer to activate. */
  requires?: LayerId[];

  /** Zoom range [min, max] (inclusive) in which the layer is visible. */
  zoomRange?: { min: number; max: number };

  /** Default desired state when the layer is first created / reset. */
  defaults: {
    opacity: number;
    params: Record<string, unknown>;
  };
}

// ── Desired state (what the user asked for) ─────────────────────────────────

export interface LayerDesiredState {
  enabled: boolean;
  opacity: number;
  params: Record<string, unknown>;
}

/** Complete desired-state map for all layers. */
export type DesiredMap = Record<LayerId, LayerDesiredState>;

// ── Runtime facts ───────────────────────────────────────────────────────────

/**
 * Runtime facts that feed into the effective-state evaluation.
 * Updated by data-fetching hooks, zoom listeners, etc.
 */
export interface LayerRuntime {
  /** Current Leaflet map zoom level. */
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

// ── Blocked reasons ─────────────────────────────────────────────────────────

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

// ── Effective state (what the map actually shows) ───────────────────────────

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

/** Complete effective-state map for all layers. */
export type EffectiveMap = Record<LayerId, LayerEffectiveState>;

// ── Actions (dispatched by UI) ──────────────────────────────────────────────

export type LayerAction =
  | { type: "TOGGLE"; id: LayerId; on: boolean }
  | { type: "SET_OPACITY"; id: LayerId; opacity: number }
  | { type: "SET_PARAM"; id: LayerId; key: string; value: unknown }
  | { type: "RESET" };
