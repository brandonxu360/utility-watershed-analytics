import { StateCreator } from 'zustand';
import { Properties } from '../../types/WatershedFeature';
import { AppState } from '../store';

export interface HillslopeSlice {
    selectedHillslopeId: number | null;
    selectedHillslopeProps: Properties | null;
    setSelectedHillslope: (id: number | null, props?: Properties | null) => void;
    clearSelectedHillslope: () => void;
}

export const createHillslopeSlice: StateCreator<
    AppState,
    [["zustand/devtools", never]],
    [],
    HillslopeSlice
> = (set) => ({
    selectedHillslopeId: null,
    selectedHillslopeProps: null,
    setSelectedHillslope: (id, props) => set({
        selectedHillslopeId: id,
        selectedHillslopeProps: props ?? null
    }),
    clearSelectedHillslope: () => set({ selectedHillslopeId: null, selectedHillslopeProps: null }),
});
