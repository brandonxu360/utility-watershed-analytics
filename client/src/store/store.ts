import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createLayersSlice, type LayersSlice } from "./slices/layersSlice";

export type {
  ActiveDataLayer,
  SbsColorMode,
  VegetationBandType,
  ScenarioType,
  ScenarioDataRow,
  ScenarioVariableType,
} from "./slices/layersSlice";

export {
  AVAILABLE_SCENARIOS,
  SCENARIO_VARIABLES,
  SCENARIO_VARIABLE_CONFIG,
} from "./slices/layersSlice";

export type AppState = LayersSlice;

export const useAppStore = create<AppState>()(
  devtools(
    (...a) => ({
      ...createLayersSlice(...a),
    }),
    { name: "app-store" },
  ),
);
