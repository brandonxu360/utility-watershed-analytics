export type QueryFilter = {
    column: string;
    operator: string;
    value: number | number[] | string;
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
    runId: string;
    topazId?: number;
    weppId?: number;
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
};