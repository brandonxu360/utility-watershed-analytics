import { StateCreator } from "zustand";
import { AppState } from "../store";
import { initialChoroplethState } from "./choroplethSlice";

export interface SharedActionsSlice {
  resetOverlays: () => void;
}

export const createSharedActionsSlice: StateCreator<
  AppState,
  [["zustand/devtools", never]],
  [],
  SharedActionsSlice
> = (set) => ({
  resetOverlays: () =>
    set({
      subcatchment: false,
      channels: false,
      patches: false,
      landuse: false,
      landuseLegendVisible: false,
      landuseLegendMap: {},
      choropleth: initialChoroplethState,
      isPanelOpen: false,
    }),
});
