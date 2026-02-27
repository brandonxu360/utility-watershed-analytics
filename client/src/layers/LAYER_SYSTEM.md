# Layer System Architecture

> Last updated: 2026-02-26

This document describes the declarative layer system that manages all toggleable
map layers in the client. It covers the type model, the registry, the
rule engine, the evaluator, the Zustand store slices, the React hooks, and
every component that consumes the system.

---

## Table of Contents

1. [Design Goals](#1-design-goals)
2. [High-Level Data Flow](#2-high-level-data-flow)
3. [File Map](#3-file-map)
4. [Type Model (`types.ts`)](#4-type-model-typests)
   - [Layer IDs](#layer-ids)
   - [Groups](#groups)
   - [Layer Descriptors](#layer-descriptors)
   - [Desired State](#desired-state)
   - [Runtime Facts](#runtime-facts)
   - [Blocked Reasons](#blocked-reasons)
   - [Effective State](#effective-state)
   - [Actions](#actions)
5. [Registry (`registry.ts`)](#5-registry-registryts)
   - [Groups Table](#groups-table)
   - [Layer Descriptors Table](#layer-descriptors-table)
   - [Helper Look-ups](#helper-look-ups)
6. [Rules (`rules.ts`)](#6-rules-rulests)
   - [Initial State](#initial-state)
   - [`applyAction`](#applyaction)
   - [Toggle Logic](#toggle-logic)
   - [`enableWithParams`](#enablewithparams)
7. [Evaluator (`evaluate.ts`)](#7-evaluator-evaluatets)
   - [Processing Order](#processing-order)
   - [Evaluation Rules](#evaluation-rules)
   - [Derived Helpers](#derived-helpers)
8. [Store Slices](#8-store-slices)
   - [`layerSlice`](#layerslice)
   - [`runtimeSlice`](#runtimeslice)
   - [`choroplethCacheSlice`](#choroplethcacheslice)
   - [Store Composition](#store-composition)
9. [React Hooks](#9-react-hooks)
   - [`useEffectiveLayers`](#useeffectivelayers)
   - [`useLayerToasts`](#uselayertoasts)
   - [`useChoropleth`](#usechoropleth)
10. [Consumer Components](#10-consumer-components)
    - [`WatershedMap`](#watershedmap)
    - [`DataLayers` / `DataLayersTabContent`](#datalayers--datalayerstabcontent)
    - [`VegetationCover`](#vegetationcover)
    - [`LandUseLegend`](#landuselegend)
    - [`SbsLegend`](#sbslegend)
    - [`MapEffect`](#mapeffect)
    - [`WatershedOverview`](#watershedoverview)
11. [Test Coverage](#11-test-coverage)
12. [Adding a New Layer](#12-adding-a-new-layer)

---

## 1. Design Goals

| Goal | How It's Achieved |
|---|---|
| **Single source of truth** | Every layer's metadata lives in `LAYER_REGISTRY`; desired state in one Zustand slice. |
| **Separation of intent vs. reality** | "Desired" (what the user asked for) and "Runtime" (what the app knows) are separate state trees. "Effective" is a pure derivation. |
| **Pure business logic** | `applyAction`, `enableWithParams`, and `evaluate` are pure functions with no side effects, no store access, and no React. Trivially unit-testable. |
| **Structured errors** | `BlockedReason` is a discriminated union — never a stringly-typed message. UI code pattern-matches on `kind`. |
| **No scattered toggles** | All toggle / param / opacity mutations route through `dispatchLayerAction` → `applyAction`. No ad-hoc boolean setters. |

---

## 2. High-Level Data Flow

```
                ┌──────────────┐
  User clicks   │   UI Event   │
  toggle / btn  └──────┬───────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  dispatchLayerAction │  (Zustand action — layerSlice)
            │  { type, id, ... }  │
            └──────────┬──────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   applyAction()      │  (Pure — rules.ts)
            │   current → next     │
            └──────────┬──────────┘
                       │  Enforces requires / exclusive / dependents
                       ▼
            ┌──────────────────────┐
            │  layerDesired (store)│  ← new DesiredMap written to store
            └──────────┬──────────┘
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                 │
     ▼                 ▼                 ▼
  Queries use       Runtime slice     useEffectiveLayers()
  desired.enabled   updated by          │
  to gate fetch     data hooks          │ evaluate(desired, runtime)
     │                 │                │    (Pure — evaluate.ts)
     │                 ▼                │
     │          ┌──────────────┐       │
     └─────────►│ layerRuntime │───────┘
                └──────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   EffectiveMap       │  Derived (memoized in hook)
            │   effective.*.enabled│
            │   effective.*.loading│
            │   blockedReasons     │
            └──────────┬──────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     Render layers  Show legends  useLayerToasts()
     on the map     conditionally fires toast on
                                  enabled → blocked
```

Key insight: **Desired state is never mutated by runtime conditions.** If a
layer can't render (no data, wrong zoom), the evaluator produces
`effective.enabled = false` with a `BlockedReason`, but `desired.enabled`
stays `true`. This makes undo / retry trivial and prevents cascading
state-mutation bugs.

---

## 3. File Map

```
client/src/
├── layers/                          # Pure layer system (no React, no store)
│   ├── types.ts                     # All type definitions
│   ├── registry.ts                  # Static metadata for every layer
│   ├── rules.ts                     # State-transition functions
│   ├── evaluate.ts                  # desired + runtime → effective
│   └── index.ts                     # Barrel re-exports
│
├── store/
│   ├── store.ts                     # Zustand store composition
│   └── slices/
│       ├── layerSlice.ts            # Desired state + dispatchLayerAction
│       ├── runtimeSlice.ts          # Runtime facts (zoom, data, loading)
│       ├── choroplethCacheSlice.ts  # Choropleth fetched data cache
│       ├── panelSlice.ts            # Bottom panel open/close
│       └── hillslopeSlice.ts        # Selected hillslope state
│
├── hooks/
│   ├── useEffectiveLayers.ts        # Derives EffectiveMap from store
│   ├── useLayerToasts.ts            # Toast notifications on block transitions
│   └── useChoropleth.ts             # Choropleth data fetching & styling
│
└── components/
    ├── map/
    │   ├── WatershedMap.tsx          # Primary map component (main consumer)
    │   ├── SubcatchmentLayer.tsx     # Subcatchment GeoJSON renderer
    │   ├── SbsLayer.tsx             # Soil Burn Severity tile layer
    │   └── controls/
    │       ├── DataLayers/
    │       │   ├── DataLayers.tsx          # Layer panel + toggle dispatch
    │       │   └── DataLayersTabContent.tsx # Tab UI, checkboxes, buttons
    │       ├── LandUseLegend.tsx     # Conditional landuse legend
    │       ├── SbsLegend.tsx         # SBS legend with color mode toggle
    │       └── ...
    ├── bottom-panels/
    │   └── VegetationCover.tsx       # Vegetation cover charting panel
    └── side-panels/
        └── WatershedOverview.tsx     # Watershed overview with RESET on back
```

---

## 4. Type Model (`types.ts`)

### Layer IDs

```typescript
type LayerId =
  | "subcatchment"   // Vector overlay — subcatchment polygons
  | "channels"       // Vector overlay — WEPP channel lines
  | "patches"        // Vector overlay — patch boundaries (placeholder)
  | "landuse"        // Vector coverage — land-use coloring per subcatchment
  | "choropleth"     // Vector coverage — RAP vegetation / ET coloring
  | "sbs"            // Raster coverage — Soil Burn Severity tiles
  | "fireSeverity";  // Raster overlay — fire severity tiles (placeholder)
```

The `ALL_LAYER_IDS` constant array provides these in iteration order.

### Groups

```typescript
type GroupId = "overlays" | "coverageStyle";
type GroupType = "multi" | "exclusive";
```

- **`overlays`** (multi): Any number of layers can be enabled simultaneously.
  Members: `subcatchment`, `channels`, `patches`, `fireSeverity`.
- **`coverageStyle`** (exclusive): At most one of these can be enabled at a
  time. Members: `landuse`, `choropleth`, `sbs`.

### Layer Descriptors

Each `LayerDescriptor` carries:

| Field | Type | Purpose |
|---|---|---|
| `id` | `LayerId` | Unique identifier |
| `label` | `string` | Human-readable name (used in UI and toasts) |
| `group` | `GroupId` | Which group this layer belongs to |
| `kind` | `"vector" \| "raster"` | Rendering paradigm |
| `pane` | `"overlayPane" \| "rasterPane"` | Leaflet pane for z-ordering |
| `zIndex` | `number` | z-index within its pane |
| `requires?` | `LayerId[]` | Prerequisite layers (e.g. `landuse` requires `subcatchment`) |
| `zoomRange?` | `{ min, max }` | Zoom bounds (inclusive) — not currently used by any layer |
| `defaults` | `{ opacity, params }` | Initial desired state values |

### Desired State

```typescript
interface LayerDesiredState {
  enabled: boolean;                    // user wants this layer on/off
  opacity: number;                     // user's chosen opacity
  params: Record<string, unknown>;     // layer-specific config (metric, year, bands, mode, etc.)
}

type DesiredMap = Record<LayerId, LayerDesiredState>;
```

`DesiredMap` is the complete desired-state map for all layers. It is always
fully populated — every `LayerId` has an entry.

### Runtime Facts

```typescript
interface LayerRuntime {
  zoom: number;                                        // current Leaflet map zoom
  dataAvailability: Partial<Record<LayerId, boolean>>; // per-layer data status
  loading: Partial<Record<LayerId, boolean>>;          // per-layer loading flags
}
```

- `dataAvailability[id] === true`: data fetched successfully (≥1 row)
- `dataAvailability[id] === false`: fetch completed but empty/errored
- `dataAvailability[id] === undefined`: not checked yet — **does NOT block**

### Blocked Reasons

A discriminated union describing *why* a layer's effective state differs from
desired:

| `kind` | Fields | Meaning |
|---|---|---|
| `"missing-data"` | `detail: string` | Server returned 0 features |
| `"requires-layer"` | `layerId: LayerId` | A prerequisite layer is not effective |
| `"zoom-out-of-range"` | `current`, `required: { min, max }` | Map zoom is outside allowed bounds |
| `"excluded-by"` | `layerId: LayerId` | Another layer in the same exclusive group is active |

### Effective State

```typescript
interface LayerEffectiveState {
  enabled: boolean;              // should the layer render?
  opacity: number;               // passthrough from desired
  loading: boolean;              // data currently being fetched (informational — does NOT block)
  blockedReasons: BlockedReason[]; // empty when effective matches desired
}

type EffectiveMap = Record<LayerId, LayerEffectiveState>;
```

### Actions

```typescript
type LayerAction =
  | { type: "TOGGLE"; id: LayerId; on: boolean }         // toggle a layer
  | { type: "SET_OPACITY"; id: LayerId; opacity: number } // change opacity
  | { type: "SET_PARAM"; id: LayerId; key: string; value: unknown } // set a param
  | { type: "RESET" };                                    // reset all to defaults
```

All layer state mutations are expressed as one of these four action types.

---

## 5. Registry (`registry.ts`)

### Groups Table

| Group ID | Label | Type | Members |
|---|---|---|---|
| `overlays` | Overlays | multi | subcatchment, channels, patches, fireSeverity |
| `coverageStyle` | Coverage Style | exclusive | landuse, choropleth, sbs |

### Layer Descriptors Table

| ID | Label | Group | Kind | Pane | zIndex | Requires | Default Opacity | Default Params |
|---|---|---|---|---|---|---|---|---|
| `subcatchment` | Subcatchments | overlays | vector | overlayPane | 400 | — | 0 | `{}` |
| `channels` | WEPP Channels | overlays | vector | overlayPane | 410 | — | 1 | `{}` |
| `patches` | Patches | overlays | vector | overlayPane | 405 | — | 0.5 | `{}` |
| `landuse` | Land Use (2025) | coverageStyle | vector | overlayPane | 420 | subcatchment | 1 | `{}` |
| `choropleth` | Coverage (Choropleth) | coverageStyle | vector | overlayPane | 420 | subcatchment | 0.85 | `{ metric: "vegetationCover", year: null, bands: "all" }` |
| `sbs` | Soil Burn Severity | coverageStyle | raster | rasterPane | 500 | — | 0.8 | `{ mode: "legacy" }` |
| `fireSeverity` | Fire Severity | overlays | raster | rasterPane | 490 | — | 0.8 | `{}` |

### Helper Look-ups

- **`getDescriptor(id)`** — Returns the descriptor for a given `LayerId`.
- **`getGroup(id)`** — Returns the `GroupDescriptor` for a `GroupId`.
- **`getLayersInGroup(groupId)`** — All descriptors belonging to a group.
- **`getDependents(id)`** — All layer IDs that list `id` in their `requires`.
  For example, `getDependents("subcatchment")` returns `["landuse", "choropleth"]`.

---

## 6. Rules (`rules.ts`)

All functions in this file are **pure**: `(currentDesired, action) → nextDesired`.
No side effects, no store access, no React.

### Initial State

```typescript
const INITIAL_DESIRED: DesiredMap = buildInitialDesired();
```

Built by iterating `LAYER_REGISTRY` — every layer starts with `enabled: false`
and takes its default `opacity` and `params` from the descriptor. This can
never drift out of sync with the registry.

```typescript
const INITIAL_RUNTIME: LayerRuntime = {
  zoom: 7,
  dataAvailability: {},
  loading: {},
};
```

Zoom 7 matches `WatershedMap`'s default center zoom.

### `applyAction`

The single entry point for all desired-state mutations:

```typescript
function applyAction(current: DesiredMap, action: LayerAction): DesiredMap
```

Dispatches on `action.type`:

| Action | Behavior |
|---|---|
| `TOGGLE` | Delegates to `applyToggle(current, id, on)` |
| `SET_OPACITY` | Returns new DesiredMap with `[id].opacity` updated |
| `SET_PARAM` | Returns new DesiredMap with `[id].params[key]` updated |
| `RESET` | Returns a fresh `buildInitialDesired()` — all layers off, defaults restored |

### Toggle Logic

`applyToggle(current, id, on)` enforces three rules:

#### When enabling (`on = true`):

1. **Auto-enable prerequisites** — If the layer has a `requires` array, each
   required layer is automatically enabled. Example: enabling `landuse`
   auto-enables `subcatchment`.

2. **Enforce exclusive groups** — If the layer belongs to an `exclusive` group,
   all other enabled layers in that group are disabled. Example: enabling
   `landuse` disables `choropleth` and `sbs` (all in `coverageStyle`).

#### When disabling (`on = false`):

3. **Cascade to dependents** — Any layer that lists the disabled layer in its
   `requires` is also disabled. Example: disabling `subcatchment` disables
   `landuse` and `choropleth`.

### `enableWithParams`

```typescript
function enableWithParams(
  current: DesiredMap,
  id: LayerId,
  params: Record<string, unknown>,
): DesiredMap
```

Convenience: sets params first, then calls `applyToggle(next, id, true)`.
Used by the "Vegetation Cover" button in `DataLayersTabContent` to enable
choropleth with `metric: "vegetationCover"` in one shot.

---

## 7. Evaluator (`evaluate.ts`)

```typescript
function evaluate(desired: DesiredMap, runtime: LayerRuntime): EffectiveMap
```

The evaluator is **pure** — it takes the two state trees and returns the
derived effective state for every layer. No side effects.

### Processing Order

Layers are processed in dependency-safe order: layers without `requires` first,
then layers with `requires`. This guarantees that when evaluating a layer's
prerequisite constraint, the prerequisite has already been evaluated.

Current order: `subcatchment, channels, patches, sbs, fireSeverity` (independent)
→ `landuse, choropleth` (dependent).

### Evaluation Rules

For each layer where `desired.enabled === true`:

1. **Data availability** — Blocked if `runtime.dataAvailability[id] === false`.
   When `undefined` (not checked yet), the layer is **NOT blocked**. This
   prevents chicken-and-egg issues where a layer can't enable because data
   hasn't been fetched yet, but data can't be fetched because the layer isn't
   enabled.

2. **Required layers** — Blocked if any prerequisite's `effective.enabled`
   is `false`. Because we process in dependency order, prerequisites are
   always evaluated before their dependents.

3. **Zoom range** — Blocked if current zoom is outside the descriptor's
   `zoomRange.min`–`zoomRange.max`. (No layers currently define zoom ranges,
   but the infrastructure is in place.)

The `loading` flag in the effective state is purely informational — a loading
layer is still "effectively enabled" so the map can show a spinner.

### Derived Helpers

- **`selectOrderedActiveIds(effective)`** — Returns effectively-enabled layer
  IDs sorted by ascending `zIndex`. Useful for rendering order.
- **`isDesiredButBlocked(id, desired, effective)`** — `true` when the user
  wants a layer on but it can't render. Useful for UI hints.

---

## 8. Store Slices

The Zustand store is composed from five slices. Three are part of the layer
system; two (`panelSlice`, `hillslopeSlice`) are orthogonal.

### `layerSlice`

**State:**

| Field | Type | Purpose |
|---|---|---|
| `layerDesired` | `DesiredMap` | Complete desired state for all layers |
| `landuseLegendMap` | `Record<string, string>` | Color → description map for LandUse legend |

**Actions:**

| Action | Signature | DevTools Label |
|---|---|---|
| `dispatchLayerAction` | `(action: LayerAction) => void` | `layer/TOGGLE/subcatchment`, `layer/SET_PARAM/choropleth`, `layer/RESET`, etc. |
| `enableLayerWithParams` | `(id: LayerId, params: Record<string, unknown>) => void` | `layer/ENABLE_WITH_PARAMS/choropleth` |
| `setLanduseLegendMap` | `(legend: Record<string, string>) => void` | — |

Under the hood, `dispatchLayerAction` calls `applyAction(state.layerDesired, action)`
and writes the result back. This is the **only** code path that modifies desired state.

### `runtimeSlice`

**State:**

| Field | Type | Purpose |
|---|---|---|
| `layerRuntime` | `LayerRuntime` | Zoom, data availability, loading flags |

**Actions:**

| Action | Signature | DevTools Label |
|---|---|---|
| `setDataAvailability` | `(id: LayerId, available: boolean \| undefined) => void` | `runtime/DATA_AVAILABILITY/subcatchment` |
| `setLayerLoading` | `(id: LayerId, loading: boolean) => void` | `runtime/LOADING/landuse` |
| `setZoom` | `(zoom: number) => void` | `runtime/ZOOM` |

These are called by `useEffect` hooks in `WatershedMap` that watch React Query
results and forward the availability / loading facts.

### `choroplethCacheSlice`

This slice holds **only** the fetched/computed data for choropleth rendering.
The control fields (metric, year, bands) live in `layerDesired.choropleth.params`.

**State:**

| Field | Type | Purpose |
|---|---|---|
| `choroplethCache.data` | `Map<number, number> \| null` | wepp_id → aggregated value |
| `choroplethCache.range` | `{ min, max } \| null` | Robust percentile range for color normalization |
| `choroplethCache.loading` | `boolean` | Fetch in progress |
| `choroplethCache.error` | `string \| null` | Error message |

**Actions:**

| Action | Purpose |
|---|---|
| `setChoroplethData(data, range)` | Store fetched data + range, clear loading |
| `setChoroplethLoading(loading)` | Set loading flag |
| `setChoroplethError(error)` | Store error, clear loading |
| `resetChoroplethCache()` | Reset to initial state |

### Store Composition

```typescript
// store.ts
export type AppState = LayerSlice & RuntimeSlice & PanelSlice & HillslopeSlice & ChoroplethCacheSlice;

export const useAppStore = create<AppState>()(
  devtools((...a) => ({
    ...createLayerSlice(...a),
    ...createRuntimeSlice(...a),
    ...createPanelSlice(...a),
    ...createHillslopeSlice(...a),
    ...createChoroplethCacheSlice(...a),
  }), { name: "app-store" }),
);
```

---

## 9. React Hooks

### `useEffectiveLayers`

```typescript
function useEffectiveLayers(): {
  effective: EffectiveMap;
  activeIds: LayerId[];
  isBlocked: (id: LayerId) => boolean;
  isEffective: (id: LayerId) => boolean;
}
```

Subscribes to `layerDesired` and `layerRuntime` from the store, calls
`evaluate()` in a `useMemo`, and returns the effective map plus convenience
selectors. Recomputes only when desired or runtime actually change.

**Consumers:** `WatershedMap`, `DataLayersTabContent`, `LandUseLegend`.

### `useLayerToasts`

```typescript
function useLayerToasts(desired: DesiredMap, effective: EffectiveMap): void
```

Called once in `WatershedMap`. Tracks the previous effective and desired state
via refs. On each update, for every layer, fires a `toast.error` when:

- The user wants the layer on (`desired[id].enabled === true`), AND
- The layer is NOT effectively enabled (`effective[id].enabled === false`), AND
- Either:
  - It **was** effectively enabled last render (became blocked), OR
  - The user **just** toggled it on (was immediately blocked).

Toast format: `"${label}: ${reasonText}"` where `label` comes from
`LAYER_REGISTRY` and `reasonText` is derived from the `BlockedReason`:

| Reason kind | Example toast text |
|---|---|
| `missing-data` | "Subcatchments: Subcatchments data is not available" |
| `requires-layer` | "Land Use (2025): Requires Subcatchments" |
| `zoom-out-of-range` | "Patches: Visible at zoom 12–18" |
| `excluded-by` | "Choropleth: Excluded by Land Use (2025)" |

### `useChoropleth`

```typescript
function useChoropleth(): {
  choropleth: ChoroplethType;   // "none" | "evapotranspiration" | "vegetationCover"
  isLoading: boolean;
  error: string | null;
  getColor: (id: number | undefined) => string | null;
  getChoroplethStyle: (id: number | undefined) => PathOptions | null;
  isActive: boolean;
  config: { title, unit, colormap, bands } | null;
}
```

Reads control fields from `layerDesired.choropleth.params` (metric, year, bands)
and data from `choroplethCache`. Handles:

1. **Data fetching** — Calls `fetchRapChoropleth` when metric/year/bands change.
2. **Color mapping** — Creates a colormap (e.g. viridis), normalizes values to
   the robust percentile range, and returns `getColor(weppId)` and
   `getChoroplethStyle(weppId)` callbacks.
3. **Cache management** — Writes fetched data to `choroplethCacheSlice` via
   `setChoroplethData`, `setChoroplethLoading`, `setChoroplethError`.

---

## 10. Consumer Components

### `WatershedMap`

The primary consumer. Integration points:

| Concern | How It Uses the Layer System |
|---|---|
| **Read desired state** | `layerDesired.subcatchment.enabled` gates React Query `enabled` flags |
| **Compute effective state** | `useEffectiveLayers()` → `isEffective("subcatchment")` etc. |
| **Fire block toasts** | `useLayerToasts(layerDesired, effective)` |
| **Report data availability** | `useEffect` watches query results → `setDataAvailability("subcatchment", hasData)` |
| **Report loading** | `useEffect` watches query loading → `setLayerLoading("subcatchment", subLoading)` |
| **Conditional rendering** | `subcatchmentEffective && <SubcatchmentLayer .../>` |
| **Choropleth styling** | `useChoropleth().getChoroplethStyle(feature.properties.weppid)` |
| **Land use styling** | `landuseEffective && landuseData[topazid]` in subcatchment style callback |
| **Legends** | `<LandUseLegend />` (auto-hides), `sbsEffective && <SbsLegend />` |

### `DataLayers` / `DataLayersTabContent`

The UI panel that lets users toggle layers.

- **`DataLayers.tsx`** — Maps checkbox DOM `id` strings to `LayerId` values, then
  calls `dispatchLayerAction({ type: "TOGGLE", id: layerId, on: checked })`.
  Also handles side effects outside the layer system (cancelling queries,
  closing panels, clearing selected hillslope).

- **`DataLayersTabContent.tsx`** — Reads `layerDesired` for checkbox `checked`
  values and `useEffectiveLayers()` for `effective` / `isBlocked`. Calls
  `enableLayerWithParams("choropleth", { metric: "vegetationCover" })` for
  the Vegetation Cover button.

### `VegetationCover`

Bottom panel for vegetation cover charting. Reads:
- `layerDesired.choropleth.params.year` and `.bands` for current selections
- `choroplethCache.range` and `.loading` for scale display

Dispatches:
- `dispatchLayerAction({ type: "SET_PARAM", id: "choropleth", key: "year", value })` on year change
- `dispatchLayerAction({ type: "SET_PARAM", id: "choropleth", key: "bands", value })` on band change
- `dispatchLayerAction({ type: "RESET" })` + `resetChoroplethCache()` on close

### `LandUseLegend`

Conditionally renders based on `isEffective("landuse")` from
`useEffectiveLayers()` and whether `landuseLegendMap` has entries.

### `SbsLegend`

Reads `layerDesired.sbs.params.mode` for the current color mode ("legacy" or
"shift"). Dispatches `SET_PARAM` to toggle colorblind-friendly mode:

```typescript
dispatchLayerAction({
  type: "SET_PARAM",
  id: "sbs",
  key: "mode",
  value: checked ? "shift" : "legacy",
})
```

### `MapEffect`

Dispatches `{ type: "RESET" }` when navigating to a new watershed to clear
all layer state before zooming.

### `WatershedOverview`

Dispatches `{ type: "RESET" }` when the user navigates back from the watershed
detail view to clear all layer state.

---

## 11. Test Coverage

All layer system code is covered by unit and integration tests.
**378 tests pass across 31 test files.**

| Test File | Tests | What It Covers |
|---|---|---|
| `evaluate.test.ts` | 16 | All evaluator rules: data availability, requires, zoom range, processing order, derived helpers |
| `rules.test.ts` | 16 | `applyAction` for all action types, toggle with requires/exclusive/dependent teardown, `enableWithParams`, `INITIAL_DESIRED`/`INITIAL_RUNTIME` |
| `useChoropleth.test.tsx` | 17 | Hook integration: reads from `layerDesired.choropleth.params`, fetches data, color mapping, cache interactions |
| `Map.test.tsx` | 46 | `WatershedMap` integration: effective state rendering, data availability reporting, loading overlays, query gating, toast integration |
| `VegetationCover.test.tsx` | 35 | Panel: year/band selection via `SET_PARAM`, close via `RESET`, store integration, RAP data fetching |
| `DataLayers.test.tsx` | 6 | Toggle dispatch, panel open/close |
| `DataLayersTabContent.test.tsx` | 8 | Checkbox binding, `enableLayerWithParams`, effective state display |
| `LandUseLegend.test.tsx` | 3 | Conditional rendering based on `isEffective("landuse")` |
| `WatershedOverview.test.tsx` | 17 | Back button → `RESET` dispatch |
| `MapEffectUtil.test.tsx` | 9 | Navigation → `RESET` dispatch |

---

## 12. Adding a New Layer

1. **`types.ts`** — Add the ID to the `LayerId` union and `ALL_LAYER_IDS` array.

2. **`registry.ts`** — Add a `LayerDescriptor` entry in `LAYER_REGISTRY` with:
   - Group membership (`overlays` or `coverageStyle`, or define a new group)
   - `kind`, `pane`, `zIndex`
   - `requires` (if it depends on another layer)
   - `zoomRange` (if it should only appear at certain zoom levels)
   - `defaults` (initial opacity and any params)

3. **Build a renderer** — Create a component (e.g. `NewLayer.tsx`) and render
   it conditionally in `WatershedMap`:
   ```tsx
   {isEffective("newLayer") && <NewLayer ... />}
   ```

4. **Wire data availability** — If the layer fetches data, add a `useEffect`
   in `WatershedMap` that calls `setDataAvailability("newLayer", hasData)`.

5. **Add toggle UI** — Add a checkbox / button in `DataLayersTabContent` that
   calls `handleToggle("newLayer", checked)` (for checkboxes) or
   `enableLayerWithParams("newLayer", { ... })` (for buttons with params).

6. **Write tests** — Add tests for the new renderer and any new toggle behavior.

No changes to `rules.ts` or `evaluate.ts` needed — the rule engine and evaluator
work entirely from the registry. The exclusive group, requires, zoom range, and
dependent teardown behaviors are all automatic.
