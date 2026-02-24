/**
 * Declarative layer registry — the single source of truth for every layer's
 * metadata, group membership, dependencies, and defaults.
 *
 * To add a new layer:
 *  1. Add the id to `LayerId` in types.ts
 *  2. Add a descriptor here
 *  3. Build a renderer component (or leave as placeholder)
 *
 * No business logic lives here — only static data.
 */

import type { LayerId, LayerDescriptor, GroupDescriptor, GroupId } from "./types";

// ── Groups ──────────────────────────────────────────────────────────────────

export const LAYER_GROUPS: Record<GroupId, GroupDescriptor> = {
  overlays: {
    id: "overlays",
    label: "Overlays",
    type: "multi",
  },
  coverageStyle: {
    id: "coverageStyle",
    label: "Coverage Style",
    type: "exclusive",
  },
};

// ── Layer descriptors ───────────────────────────────────────────────────────

export const LAYER_REGISTRY: Record<LayerId, LayerDescriptor> = {
  subcatchment: {
    id: "subcatchment",
    label: "Subcatchments",
    group: "overlays",
    kind: "vector",
    pane: "overlayPane",
    zIndex: 400,
    defaults: { opacity: 0, params: {} },
  },

  channels: {
    id: "channels",
    label: "WEPP Channels",
    group: "overlays",
    kind: "vector",
    pane: "overlayPane",
    zIndex: 410,
    defaults: { opacity: 1, params: {} },
  },

  patches: {
    id: "patches",
    label: "Patches",
    group: "overlays",
    kind: "vector",
    pane: "overlayPane",
    zIndex: 405,
    // Placeholder — no renderer yet
    defaults: { opacity: 0.5, params: {} },
  },

  landuse: {
    id: "landuse",
    label: "Land Use (2025)",
    group: "coverageStyle",
    kind: "vector",
    pane: "overlayPane",
    zIndex: 420,
    requires: ["subcatchment"],
    defaults: { opacity: 1, params: {} },
  },

  choropleth: {
    id: "choropleth",
    label: "Coverage (Choropleth)",
    group: "coverageStyle",
    kind: "vector",
    pane: "overlayPane",
    zIndex: 420,
    requires: ["subcatchment"],
    defaults: {
      opacity: 0.85,
      params: { metric: "vegetationCover", year: null, bands: "all" },
    },
  },

  sbs: {
    id: "sbs",
    label: "Soil Burn Severity",
    group: "coverageStyle",
    kind: "raster",
    pane: "rasterPane",
    zIndex: 500,
    defaults: { opacity: 0.8, params: { mode: "legacy" } },
  },

  fireSeverity: {
    id: "fireSeverity",
    label: "Fire Severity",
    group: "overlays",
    kind: "raster",
    pane: "rasterPane",
    zIndex: 490,
    // Placeholder — no renderer yet
    defaults: { opacity: 0.8, params: {} },
  },
};

// ── Helper look-ups ─────────────────────────────────────────────────────────

export function getDescriptor(id: LayerId): LayerDescriptor {
  return LAYER_REGISTRY[id];
}

export function getGroup(id: GroupId): GroupDescriptor {
  return LAYER_GROUPS[id];
}

/** Return all layer descriptors that belong to `groupId`. */
export function getLayersInGroup(groupId: GroupId): LayerDescriptor[] {
  return Object.values(LAYER_REGISTRY).filter((l) => l.group === groupId);
}

/** Return all layer ids that list `id` in their `requires` array. */
export function getDependents(id: LayerId): LayerId[] {
  return (Object.values(LAYER_REGISTRY) as LayerDescriptor[])
    .filter((l) => l.requires?.includes(id))
    .map((l) => l.id);
}
