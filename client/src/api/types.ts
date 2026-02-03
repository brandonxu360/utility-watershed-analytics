export type QueryFilter = {
    column: string;
    op: string;
    value?: number | number[] | string;
};

export const YEAR_BOUNDS = { min: 1900, max: 2100 } as const;

export type RapTimeseriesPayload = {
    datasets: { path: string; alias?: string }[];
    columns: string[];
    filters?: QueryFilter[];
    order_by?: string[];
    include_schema?: boolean;
    include_sql?: boolean;
};

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
    mode: 'hillslope' | 'watershed';
    topazId?: number;
    weppId?: number;
    runIdOrPath?: string;
    year?: number;
    include_schema?: boolean;
    include_sql?: boolean;
};

export type FetchRapChoroplethOptions = {
    runIdOrPath?: string;
    band: number | number[];
    year?: number | null;
    include_schema?: boolean;
    include_sql?: boolean;
};

export type RapChoroplethRow = {
    wepp_id: number;
    value: number;
};

export type OpenETDatasetKey = 'ensemble' | 'eemetric' | string;

export type OpenETRow = {
    topaz_id: string;
    year: number;
    month: number;
    value: number;
};

export type OpenETMonthlyOverlayRow = {
    topaz_id: string;
    value: number;
};

export type OpenETDatasetKeyRow = {
    dataset_key: string;
};

export type OpenETMonthYearRow = {
    year: number;
    month: number;
};

export type OpenETAreaWeightedRow = {
    year: number;
    month: number;
    area_weighted: number;
};

export type FetchOpenETMonthlyOverlayOptions = {
    runIdOrPath?: string;
    datasetKey: OpenETDatasetKey;
    year: number;
    month: number;
    include_schema?: boolean;
    include_sql?: boolean;
};

export type FetchOpenETDatasetKeysOptions = {
    runIdOrPath?: string;
    include_schema?: boolean;
    include_sql?: boolean;
};

export type FetchOpenETMonthListOptions = {
    runIdOrPath?: string;
    include_schema?: boolean;
    include_sql?: boolean;
};

export type FetchOpenETTimeseriesOptions = {
    runIdOrPath?: string;
    datasetKey: OpenETDatasetKey;
    topazId?: string;
    include_schema?: boolean;
    include_sql?: boolean;
};

export type FetchOpenETAreaWeightedOptions = {
    runIdOrPath?: string;
    datasetKey: OpenETDatasetKey;
    include_schema?: boolean;
    include_sql?: boolean;
};