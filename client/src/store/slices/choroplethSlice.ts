import { StateCreator } from 'zustand';
import { AppState } from '../store';

export type ChoroplethType = 'none' | 'evapotranspiration' | 'soilMoisture' | 'vegetationCover';
export type VegetationBandType = 'all' | 'shrub' | 'tree';

export interface ChoroplethState {
    type: ChoroplethType;
    year: number | null;
    bands: VegetationBandType;
    data: Map<number, number> | null;
    range: { min: number; max: number } | null;
    loading: boolean;
    error: string | null;
}

const initialChoroplethState: ChoroplethState = {
    type: 'none',
    year: null,
    bands: 'all',
    data: null,
    range: null,
    loading: false,
    error: null,
};

export interface ChoroplethSlice {
    choropleth: ChoroplethState;
    setChoroplethType: (type: ChoroplethType) => void;
    setChoroplethYear: (year: number | null) => void;
    setChoroplethBands: (bands: VegetationBandType) => void;
    setChoroplethData: (data: Map<number, number> | null, range: { min: number; max: number } | null) => void;
    setChoroplethLoading: (loading: boolean) => void;
    setChoroplethError: (error: string | null) => void;
    resetChoropleth: () => void;
}

export const createChoroplethSlice: StateCreator<
    AppState,
    [["zustand/devtools", never]],
    [],
    ChoroplethSlice
> = (set) => ({
    choropleth: initialChoroplethState,
    setChoroplethType: (type) => set((state) => ({
        choropleth: { ...state.choropleth, type }
    })),
    setChoroplethYear: (year) => set((state) => ({
        choropleth: { ...state.choropleth, year }
    })),
    setChoroplethBands: (bands) => set((state) => ({
        choropleth: { ...state.choropleth, bands }
    })),
    setChoroplethData: (data, range) => set((state) => ({
        choropleth: { ...state.choropleth, data, range }
    })),
    setChoroplethLoading: (loading) => set((state) => ({
        choropleth: { ...state.choropleth, loading }
    })),
    setChoroplethError: (error) => set((state) => ({
        choropleth: { ...state.choropleth, error }
    })),
    resetChoropleth: () => set({ choropleth: initialChoroplethState }),
});

export { initialChoroplethState };
