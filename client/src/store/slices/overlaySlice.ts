import { StateCreator } from "zustand";
import { AppState } from "../store";

export interface OverlaySlice {
  subcatchment: boolean;
  channels: boolean;
  patches: boolean;
  landuse: boolean;
  setSubcatchment: (value: boolean) => void;
  setChannels: (value: boolean) => void;
  setPatches: (value: boolean) => void;
  setLanduse: (value: boolean) => void;
}

export const createOverlaySlice: StateCreator<
  AppState,
  [["zustand/devtools", never]],
  [],
  OverlaySlice
> = (set) => ({
  subcatchment: false,
  channels: false,
  patches: false,
  landuse: false,
  setSubcatchment: (value) => set({ subcatchment: value }),
  setChannels: (value) => set({ channels: value }),
  setPatches: (value) => set({ patches: value }),
  setLanduse: (value) => set({ landuse: value }),
});
