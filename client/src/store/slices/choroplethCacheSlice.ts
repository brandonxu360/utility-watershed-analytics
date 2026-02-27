/**
 * Choropleth data cache slice.
 *
 * This slice holds ONLY the fetched/computed data for choropleth rendering:
 *  - data (Map<number, number>)
 *  - range (min/max)
 *  - loading / error
 *
 * The control fields (metric, year, bands) have moved into the layer system
 * as `layerDesired.choropleth.params`.
 */

import { StateCreator } from "zustand";
import { AppState } from "../store";

export interface ChoroplethCacheState {
  data: Map<number, number> | null;
  range: { min: number; max: number } | null;
  loading: boolean;
  error: string | null;
}

export const initialChoroplethCacheState: ChoroplethCacheState = {
  data: null,
  range: null,
  loading: false,
  error: null,
};

export interface ChoroplethCacheSlice {
  choroplethCache: ChoroplethCacheState;
  setChoroplethData: (
    data: Map<number, number> | null,
    range: { min: number; max: number } | null,
  ) => void;
  setChoroplethLoading: (loading: boolean) => void;
  setChoroplethError: (error: string | null) => void;
  resetChoroplethCache: () => void;
}

export const createChoroplethCacheSlice: StateCreator<
  AppState,
  [["zustand/devtools", never]],
  [],
  ChoroplethCacheSlice
> = (set) => ({
  choroplethCache: initialChoroplethCacheState,
  setChoroplethData: (data, range) =>
    set((state) => ({
      choroplethCache: {
        ...state.choroplethCache,
        data,
        range,
        loading: false,
      },
    })),
  setChoroplethLoading: (loading) =>
    set((state) => ({
      choroplethCache: { ...state.choroplethCache, loading },
    })),
  setChoroplethError: (error) =>
    set((state) => ({
      choroplethCache: { ...state.choroplethCache, error, loading: false },
    })),
  resetChoroplethCache: () =>
    set({ choroplethCache: initialChoroplethCacheState }),
});
