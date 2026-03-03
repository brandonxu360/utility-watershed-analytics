export type VegetationBandType = "all" | "shrub" | "tree";

/** Chart line-key config for each vegetation band. */
type ChartKey = {
  key: string;
  color: string;
  activeFill: string;
  activeStroke: string;
};

const SHRUB_KEY: ChartKey = {
  key: "shrub",
  color: "#8B4513",
  activeFill: "#d7a17a",
  activeStroke: "#5c3317",
};
const TREE_KEY: ChartKey = {
  key: "tree",
  color: "#4caf50",
  activeFill: "#a5d6a7",
  activeStroke: "#2e7d32",
};

export const VEGETATION_OPTIONS: {
  value: VegetationBandType;
  label: string;
  chartKeys: ChartKey[];
}[] = [
  { value: "all", label: "All", chartKeys: [SHRUB_KEY, TREE_KEY] },
  { value: "shrub", label: "Shrub", chartKeys: [SHRUB_KEY] },
  { value: "tree", label: "Tree", chartKeys: [TREE_KEY] },
];

// Band mapping for vegetation cover options
export const VEGETATION_BANDS: Record<VegetationBandType, number[]> = {
  all: [5, 6], // shrub + tree
  shrub: [5], // shrub only
  tree: [6], // tree only
};

export const startYear = 1986;
export const endYear = 2023;
