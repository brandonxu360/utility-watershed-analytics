export type SpatialScale = "hillslope" | "patch";

export type RhessysSpatialLegendStop = {
  value: number;
  hex: string;
};

export type RhessysSpatialFile = {
  filename: string;
  name: string;
  type: "continuous" | "categorical" | "stream";
  min: number | null;
  max: number | null;
  unique_values: number[] | null;
  group: string | null;
  reversed: boolean;
  legend: RhessysSpatialLegendStop[] | null;
};

export type RhessysSpatialListResponse = {
  files: RhessysSpatialFile[];
};

export type RhessysOutputVariable = {
  id: string;
  label: string;
  units: string;
  filename: string;
};

export type RhessysOutputScenario = {
  id: string;
  label: string;
  is_change: boolean;
  variables: string[];
};

export type RhessysOutputValueRange = {
  min: number;
  max: number;
};

export type RhessysOutputListResponse = {
  scenarios: RhessysOutputScenario[];
  variables: RhessysOutputVariable[];
  value_ranges?: Record<string, Record<string, RhessysOutputValueRange>>;
};

export type RhessysChoroplethRow = {
  spatialId: number;
  value: number;
};
