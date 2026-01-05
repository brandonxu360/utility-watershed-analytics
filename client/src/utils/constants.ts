import { VegetationBandType } from "../store/slices/choroplethSlice";

// RAP band codes:
// 1: annual forbs & grasses
// 2: bare ground
// 3: litter
// 4: perennial forbs & grasses
// 5: shrub
// 6: tree

// Band mapping for vegetation cover options
export const VEGETATION_BANDS: Record<VegetationBandType, number[]> = {
    all: [5, 6],   // shrub + tree
    shrub: [5],    // shrub only
    tree: [6],     // tree only
};

// Evapotranspiration bands: annual forbs & grasses, perennial forbs & grasses, shrub, tree
export const ET_BANDS = [1, 4, 5, 6];

// Soil moisture bands: bare ground, litter
export const SOIL_MOISTURE_BANDS = [2, 3];

export const startYear = 1986;
export const endYear = 2023;