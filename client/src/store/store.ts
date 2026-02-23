import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createOverlaySlice, type OverlaySlice } from "./slices/overlaySlice";
import { createLanduseSlice, type LanduseSlice } from "./slices/landuseSlice";
import { createPanelSlice, type PanelSlice } from "./slices/panelSlice";

import {
  createHillslopeSlice,
  type HillslopeSlice,
} from "./slices/hillslopeSlice";

import {
  createChoroplethSlice,
  type ChoroplethSlice,
} from "./slices/choroplethSlice";

import {
  createSharedActionsSlice,
  type SharedActionsSlice,
} from "./slices/sharedActionsSlice";

import { createSbsSlice, type SbsSlice } from "./slices/sbsSlice";

export type AppState = OverlaySlice &
  LanduseSlice &
  PanelSlice &
  HillslopeSlice &
  ChoroplethSlice &
  SharedActionsSlice &
  SbsSlice;

export const useAppStore = create<AppState>()(
  devtools(
    (...a) => ({
      ...createOverlaySlice(...a),
      ...createLanduseSlice(...a),
      ...createPanelSlice(...a),
      ...createHillslopeSlice(...a),
      ...createChoroplethSlice(...a),
      ...createSharedActionsSlice(...a),
      ...createSbsSlice(...a),
    }),
    { name: "app-store" },
  ),
);
