import { StateCreator } from 'zustand';
import { SubcatchmentProperties } from '../../types/SubcatchmentProperties';
import { AppState } from '../store';

export interface HillslopeSlice {
    selectedHillslopeId: number | null;
    selectedHillslopeProps: SubcatchmentProperties | null;
    setSelectedHillslope: (id: number | null, props?: SubcatchmentProperties | null) => void;
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
