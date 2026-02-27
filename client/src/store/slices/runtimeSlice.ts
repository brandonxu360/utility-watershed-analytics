/**
 * Zustand slice for runtime facts that feed into the layer evaluator.
 *
 * These represent "what the app knows right now" — data availability,
 * loading flags, current zoom level. They are updated by fetch hooks and
 * map event handlers.
 *
 * The evaluator (layers/evaluate.ts) combines desired + runtime to
 * produce effective state.
 */

import { StateCreator } from "zustand";
import type { AppState } from "../store";
import type { LayerId, LayerRuntime } from "../../layers/types";
import { INITIAL_RUNTIME } from "../../layers/rules";

export interface RuntimeSlice {
  /** Runtime facts for the layer evaluator. */
  layerRuntime: LayerRuntime;

  /**
   * Update data availability for a specific layer.
   *  - `true`      → data fetched successfully with ≥1 feature/row
   *  - `false`     → fetch completed but data is empty/errored
   *  - `undefined` → not checked yet (clear the flag)
   */
  setDataAvailability: (id: LayerId, available: boolean | undefined) => void;

  /** Update loading flag for a specific layer. */
  setLayerLoading: (id: LayerId, loading: boolean) => void;

  /** Update the current map zoom level. */
  setZoom: (zoom: number) => void;
}

export const createRuntimeSlice: StateCreator<
  AppState,
  [["zustand/devtools", never]],
  [],
  RuntimeSlice
> = (set) => ({
  layerRuntime: INITIAL_RUNTIME,

  setDataAvailability: (id, available) =>
    set(
      (state) => ({
        layerRuntime: {
          ...state.layerRuntime,
          dataAvailability: {
            ...state.layerRuntime.dataAvailability,
            [id]: available,
          },
        },
      }),
      undefined,
      `runtime/DATA_AVAILABILITY/${id}`,
    ),

  setLayerLoading: (id, loading) =>
    set(
      (state) => ({
        layerRuntime: {
          ...state.layerRuntime,
          loading: {
            ...state.layerRuntime.loading,
            [id]: loading,
          },
        },
      }),
      undefined,
      `runtime/LOADING/${id}`,
    ),

  setZoom: (zoom) =>
    set(
      (state) => ({
        layerRuntime: {
          ...state.layerRuntime,
          zoom,
        },
      }),
      undefined,
      `runtime/ZOOM`,
    ),
});
