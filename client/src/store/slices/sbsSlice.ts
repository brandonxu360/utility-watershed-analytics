import { StateCreator } from "zustand";
import { AppState } from "../store";
import { SbsColorMode } from "../../api/types";

export interface SbsSlice {
  sbsEnabled: boolean;
  sbsColorMode: SbsColorMode;
  setSbsEnabled: (value: boolean) => void;
  setSbsColorMode: (mode: SbsColorMode) => void;
}

export const createSbsSlice: StateCreator<
  AppState,
  [["zustand/devtools", never]],
  [],
  SbsSlice
> = (set) => ({
  sbsEnabled: false,
  sbsColorMode: "legacy",
  setSbsEnabled: (value) => set({ sbsEnabled: value }),
  setSbsColorMode: (mode) => set({ sbsColorMode: mode }),
});
