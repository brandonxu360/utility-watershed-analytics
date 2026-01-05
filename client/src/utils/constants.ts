import { VegetationBandType } from "../store/slices/choroplethSlice";

// Band mapping for vegetation cover options
export const VEGETATION_BANDS: Record<VegetationBandType, number[]> = {
    all: [5, 6],   // shrub + tree
    shrub: [5],    // shrub only
    tree: [6],     // tree only
};

// Evapotranspiration bands: annual forbs & grasses, perennial forbs & grasses, shrub, tree
export const ET_BANDS = [1, 4, 5, 6];

export const startYear = 1986;
export const endYear = 2023;