import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { createLayerSlice, type LayerSlice } from "./slices/layerSlice";
import { createRuntimeSlice, type RuntimeSlice } from "./slices/runtimeSlice";
import { createPanelSlice, type PanelSlice } from "./slices/panelSlice";
import {
  createHillslopeSlice,
  type HillslopeSlice,
} from "./slices/hillslopeSlice";
import {
  createChoroplethCacheSlice,
  type ChoroplethCacheSlice,
} from "./slices/choroplethCacheSlice";

export type AppState = LayerSlice &
  RuntimeSlice &
  PanelSlice &
  HillslopeSlice &
  ChoroplethCacheSlice;

export const useAppStore = create<AppState>()(
  devtools(
    (...a) => ({
      ...createLayerSlice(...a),
      ...createRuntimeSlice(...a),
      ...createPanelSlice(...a),
      ...createHillslopeSlice(...a),
      ...createChoroplethCacheSlice(...a),
    }),
    { name: "app-store" },
  ),
);
