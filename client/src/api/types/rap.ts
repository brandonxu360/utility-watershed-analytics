export type RapRow = {
  topaz_id: number;
  year: number;
  band: number;
  value: number;
};

export type AggregatedRapRow = {
  year: number;
  shrub: number;
  tree: number;
  coverage: number;
};

export type FetchRapOptions = {
  mode: "hillslope" | "watershed";
  runId: string;
  topazId?: number;
  year?: number;
  include_schema?: boolean;
  include_sql?: boolean;
};

export type FetchRapChoroplethOptions = {
  runId: string;
  band: number | number[];
  year?: number | null;
  include_schema?: boolean;
  include_sql?: boolean;
};

export type RapChoroplethRow = {
  wepp_id: number;
  value: number;
  shrub?: number;
  tree?: number;
};
