export type RapTimeseriesPayload = {
    datasets: { path: string; alias?: string }[];
    columns: string[];
    filters?: Array<{ column: string; operator: string; value: string | number }>;
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