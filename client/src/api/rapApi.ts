import { API_ENDPOINTS } from './apiEndpoints';

export type RapQueryPayload = {
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

/**
 * Build a RAP timeseries query payload for a single Topaz ID.
 */
function buildRapTimeseriesPayload(topazId: number, year?: number): RapQueryPayload {
    const filters: RapQueryPayload['filters'] = [
        { column: 'rap.topaz_id', operator: '=', value: Number(topazId) }
    ];

    if (typeof year !== 'undefined' && year !== null) {
        filters.push({ column: 'rap.year', operator: '=', value: Number(year) });
    }

    return {
        datasets: [
            { path: 'rap/rap_ts.parquet', alias: 'rap' }
        ],
        columns: [
            'rap.topaz_id AS topaz_id',
            'rap.year AS year',
            'rap.band AS band',
            'rap.value AS value'
        ],
        filters,
        order_by: ['rap.year', 'rap.band'],
        include_schema: false,
        include_sql: false,
    };
}

/**
 * Execute a RAP timeseries query against the query engine for the provided run path.
 *
 * @param topazId - Topaz ID (int or string) to query
 * @param batchPath - The batch path portion used by the query service, e.g. 'batch;;nasa-roses-2025;;wa-72'
 */
export async function fetchRapTimeseries(topazId: number, batchPath = 'batch;;nasa-roses-2025;;wa-', year?: number) {
    const payload = buildRapTimeseriesPayload(topazId, year);
    const url = API_ENDPOINTS.QUERY_RUN(batchPath + `${topazId}`);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`RAP query failed: ${res.status} ${res.statusText} - ${text}`);
    }

    const json = await res.json();

    // Normalize to RapRow[]: handle common response shapes returned by the query engine.
    let rawRows: RapRow[] = [];
    if (Array.isArray(json)) {
        rawRows = json;
    } else if (Array.isArray(json.records)) {
        rawRows = json.records;
    } else if (Array.isArray(json.rows)) {
        rawRows = json.rows;
    } else if (Array.isArray(json.data)) {
        rawRows = json.data;
    } else if (json?.result && Array.isArray(json.result.records)) {
        rawRows = json.result.records;
    } else {
        rawRows = [];
    }

    const rows = rawRows
        .map((r) => ({
            topaz_id: Number(r.topaz_id),
            year: Number(r.year),
            band: Number(r.band),
            value: Number(r.value),
        }))
        .filter((r) => Number.isFinite(r.topaz_id) && Number.isFinite(r.year) && Number.isFinite(r.band) && Number.isFinite(r.value));

    return rows as RapRow[];
}

export default fetchRapTimeseries;
