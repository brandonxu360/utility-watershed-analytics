/**
 * Zustand slice for the layer desired-state.
 *
 * All layer toggle / param / opacity mutations flow through `dispatchLayerAction`
 * which delegates to the pure rule engine in layers/rules.ts.
 *
 * This is the ONLY place desired state is modified — no more scattered
 * setSubcatchment / setLanduse / setSbsEnabled in ad-hoc handlers.
 */

import { StateCreator } from "zustand";
import type { AppState } from "../store";
import type { DesiredMap, LayerAction } from "../../layers/types";
import {
  INITIAL_DESIRED,
  applyAction,
  enableWithParams,
} from "../../layers/rules";
import type { LayerId } from "../../layers/types";

export interface LayerSlice {
  /** The user's desired layer state — what they toggled on/off. */
  layerDesired: DesiredMap;

  /** Dispatch any layer action (TOGGLE, SET_PARAM, SET_OPACITY, RESET). */
  dispatchLayerAction: (action: LayerAction) => void;

  /**
   * Convenience: enable a layer with params in one shot.
   * E.g. enabling choropleth with metric = "vegetationCover".
   */
  enableLayerWithParams: (id: LayerId, params: Record<string, unknown>) => void;

  /** Landuse legend map (color → description) — derived from fetched data. */
  landuseLegendMap: Record<string, string>;
  setLanduseLegendMap: (legend: Record<string, string>) => void;
}

export const createLayerSlice: StateCreator<
  AppState,
  [["zustand/devtools", never]],
  [],
  LayerSlice
> = (set) => ({
  layerDesired: INITIAL_DESIRED,

  dispatchLayerAction: (action) =>
    set(
      (state) => ({
        layerDesired: applyAction(state.layerDesired, action),
      }),
      undefined,
      `layer/${action.type}${"id" in action ? `/${action.id}` : ""}`,
    ),

  enableLayerWithParams: (id, params) =>
    set(
      (state) => ({
        layerDesired: enableWithParams(state.layerDesired, id, params),
      }),
      undefined,
      `layer/ENABLE_WITH_PARAMS/${id}`,
    ),

  landuseLegendMap: {},
  setLanduseLegendMap: (legend) => set({ landuseLegendMap: legend }),
});
