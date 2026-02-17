import { StateCreator } from "zustand";
import { AppState } from "../store";

export interface LanduseSlice {
  landuseLegendVisible: boolean;
  landuseLegendMap: Record<string, string>;
  setLanduseLegendVisible: (value: boolean) => void;
  setLanduseLegendMap: (legend: Record<string, string>) => void;
}

export const createLanduseSlice: StateCreator<
  AppState,
  [["zustand/devtools", never]],
  [],
  LanduseSlice
> = (set) => ({
  landuseLegendVisible: false,
  landuseLegendMap: {},
  setLanduseLegendVisible: (value) => set({ landuseLegendVisible: value }),
  setLanduseLegendMap: (legend) => set({ landuseLegendMap: legend }),
});
