import { StateCreator } from "zustand";
import { AppState } from "../store";
import { SbsColorMode } from "../../api/types";

export type VegetationBandType = "all" | "shrub" | "tree";

export type ActiveDataLayer =
  | "none"
  | "landuse"
  | "vegetationCover"
  | "soilBurnSeverity";


export type { SbsColorMode } from "../../api/types";

export interface LayersState {
  activeDataLayer: ActiveDataLayer;

  subcatchment: boolean;
  channels: boolean;

  choroplethYear: number | null;
  choroplethBands: VegetationBandType;
  choroplethData: Map<number, number> | null;
  choroplethRange: { min: number; max: number } | null;
  choroplethLoading: boolean;
  choroplethError: string | null;

  sbsColorMode: SbsColorMode;

  landuseLegendMap: Record<string, string>;

  selectedHillslopeId: number | null;
  selectedHillslopeProps: Record<string, unknown> | null;
}

export const initialLayersState: LayersState = {
  activeDataLayer: "none",
  subcatchment: false,
  channels: false,
  choroplethYear: null,
  choroplethBands: "all",
  choroplethData: null,
  choroplethRange: null,
  choroplethLoading: false,
  choroplethError: null,
  sbsColorMode: "legacy",
  landuseLegendMap: {},
  selectedHillslopeId: null,
  selectedHillslopeProps: null,
};

export interface LayersSlice extends LayersState {
  setActiveDataLayer: (layer: ActiveDataLayer) => void;

  setSubcatchment: (value: boolean) => void;
  setChannels: (value: boolean) => void;

  setChoroplethYear: (year: number | null) => void;
  setChoroplethBands: (bands: VegetationBandType) => void;
  setChoroplethData: (
    data: Map<number, number> | null,
    range: { min: number; max: number } | null,
  ) => void;
  setChoroplethLoading: (loading: boolean) => void;
  setChoroplethError: (error: string | null) => void;

  setSbsColorMode: (mode: SbsColorMode) => void;
  setLanduseLegendMap: (legend: Record<string, string>) => void;
  setSelectedHillslope: (
    id: number | null,
    props?: Record<string, unknown> | null,
  ) => void;
  clearSelectedHillslope: () => void;

  closeVegetationCover: () => void;
  closeLanduse: () => void;
  closeSoilBurnSeverity: () => void;

  resetLayers: () => void;
}

export const createLayersSlice: StateCreator<
  AppState,
  [["zustand/devtools", never]],
  [],
  LayersSlice
> = (set) => ({
  ...initialLayersState,

  setActiveDataLayer: (layer) => {
    if (layer === "none") {
      set({ activeDataLayer: "none" });
    } else {
      set({
        activeDataLayer: layer,
        subcatchment: true,
      });
    }
  },

  setSubcatchment: (value) => set({ subcatchment: value }),
  setChannels: (value) => set({ channels: value }),

  setChoroplethYear: (year) => set({ choroplethYear: year }),
  setChoroplethBands: (bands) => set({ choroplethBands: bands }),
  setChoroplethData: (data, range) =>
    set({ choroplethData: data, choroplethRange: range }),
  setChoroplethLoading: (loading) => set({ choroplethLoading: loading }),
  setChoroplethError: (error) => set({ choroplethError: error }),

  setSbsColorMode: (mode) => set({ sbsColorMode: mode }),
  setLanduseLegendMap: (legend) => set({ landuseLegendMap: legend }),

  setSelectedHillslope: (id, props) =>
    set({
      selectedHillslopeId: id,
      selectedHillslopeProps: props ?? null,
    }),
  clearSelectedHillslope: () =>
    set({ selectedHillslopeId: null, selectedHillslopeProps: null }),

  closeVegetationCover: () =>
    set({
      activeDataLayer: "none",
      subcatchment: false,
      choroplethYear: null,
      choroplethBands: "all",
      choroplethData: null,
      choroplethRange: null,
      choroplethLoading: false,
      choroplethError: null,
      selectedHillslopeId: null,
      selectedHillslopeProps: null,
    }),

  closeLanduse: () =>
    set({
      activeDataLayer: "none",
      subcatchment: false,
      landuseLegendMap: {},
      selectedHillslopeId: null,
      selectedHillslopeProps: null,
    }),

  closeSoilBurnSeverity: () =>
    set({
      activeDataLayer: "none",
      subcatchment: false,
      sbsColorMode: "legacy",
      selectedHillslopeId: null,
      selectedHillslopeProps: null,
    }),

  resetLayers: () => set({ ...initialLayersState }),
});
