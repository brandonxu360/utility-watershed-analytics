import { API_ENDPOINTS } from './apiEndpoints';

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

/**
 * Build a RAP timeseries query payload for a single Topaz ID.
 * RAP band codes (kept as reference):
 * - 1: annual forbs & grasses
 * - 2: bare ground
 * - 3: litter
 * - 4: perennial forbs & grasses
 * - 5: shrub
 * - 6: tree
 */
function buildRapTimeseriesPayload(topazId: number, year?: number): RapTimeseriesPayload {
    const filters: RapTimeseriesPayload['filters'] = [
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
 * Supports hillslope (raw rap rows aggregated client-side)
 * and watershed (server-side CASE aggregations) modes. Returns AggregatedRapRow[]
 * (per-year rows with shrub/tree/coverage fields) which is the shape the UI needs.
 */
export async function fetchRap(opts: FetchRapOptions): Promise<AggregatedRapRow[]> {
    const { mode, topazId, weppId, runIdOrPath, year, include_schema, include_sql } = opts;

    // Build runPath
    let runPath: string;
    if (runIdOrPath) {
        runPath = String(runIdOrPath).startsWith('batch;;') ? String(runIdOrPath) : `batch;;nasa-roses-2025;;${String(runIdOrPath)}`;
    } else if (mode === 'hillslope' && typeof topazId !== 'undefined') {
        runPath = `batch;;nasa-roses-2025;;wa-${topazId}`;
    } else {
        // Default placeholder if nothing provided (caller should usually provide runIdOrPath)
        runPath = `batch;;nasa-roses-2025;;wa-`;
    }

    let payload: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (mode === 'hillslope') {
        if (typeof topazId === 'undefined') throw new Error('topazId required for hillslope mode');
        payload = buildRapTimeseriesPayload(topazId, year);
        if (typeof include_schema !== 'undefined') payload.include_schema = include_schema;
        if (typeof include_sql !== 'undefined') payload.include_sql = include_sql;
    } else {
        if (typeof weppId === 'undefined') throw new Error('weppId required for watershed mode');

        const yearCondition = (typeof year !== 'undefined' && year !== null) ? ` AND rap.year = ${Number(year)}` : '';

        payload = {
            datasets: [
                { path: 'rap/rap_ts.parquet', alias: 'rap' },
                { path: 'watershed/hillslopes.parquet', alias: 'hillslopes' }
            ],
            joins: [{ left: 'rap', right: 'hillslopes', on: ['topaz_id'] }],
            columns: ['rap.year AS year'],
            aggregations: [
                { alias: 'shrub', expression: `SUM(CASE WHEN hillslopes.wepp_id = ${Number(weppId)}${yearCondition} AND rap.band = 5 THEN rap.value ELSE 0 END)` },
                { alias: 'tree', expression: `SUM(CASE WHEN hillslopes.wepp_id = ${Number(weppId)}${yearCondition} AND rap.band = 6 THEN rap.value ELSE 0 END)` },
                { alias: 'coverage', expression: `SUM(CASE WHEN hillslopes.wepp_id = ${Number(weppId)}${yearCondition} AND rap.band IN (1,4,5,6) THEN rap.value ELSE 0 END)` }
            ],
            group_by: ['rap.year'],
            order_by: ['rap.year'],
        };
        if (typeof include_schema !== 'undefined') payload.include_schema = include_schema;
        if (typeof include_sql !== 'undefined') payload.include_sql = include_sql;
    }

    const url = API_ENDPOINTS.QUERY_RUN(runPath);

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`RAP query failed: ${res.status} ${res.statusText} - ${text}`);
    }

    const json = await res.json();

    const rawRows: any[] = Array.isArray(json) // eslint-disable-line @typescript-eslint/no-explicit-any
        ? json
        : Array.isArray(json.records)
            ? json.records
            : Array.isArray(json.rows)
                ? json.rows
                : Array.isArray(json.data)
                    ? json.data
                    : Array.isArray(json?.result?.records)
                        ? json.result.records
                        : [];

    if (mode === 'watershed') {
        // Map server-aggregated rows straight to AggregatedRapRow
        const rows = rawRows
            .map((r) => ({ year: Number(r.year), shrub: Number(r.shrub ?? r.shub ?? 0), tree: Number(r.tree ?? 0), coverage: Number(r.coverage ?? r.cover ?? 0) }))
            .filter((r) => Number.isFinite(r.year));
        return rows as AggregatedRapRow[];
    }

    // hillslope: raw band rows -> aggregate client-side to per-year
    const bandRows: RapRow[] = rawRows
        .map((r) => ({ topaz_id: Number(r.topaz_id), year: Number(r.year), band: Number(r.band), value: Number(r.value) }))
        .filter((r) => Number.isFinite(r.topaz_id) && Number.isFinite(r.year) && Number.isFinite(r.band) && Number.isFinite(r.value));

    const map = new Map<number, { coverage: number; shrub: number; tree: number }>();
    const startYear = 1986; const endYear = 2023;
    for (let y = startYear; y <= endYear; y++) map.set(y, { coverage: 0, shrub: 0, tree: 0 });

    for (const r of bandRows) {
        const entry = map.get(r.year);
        if (!entry) continue;
        if ([1, 4, 5, 6].includes(r.band)) entry.coverage += r.value;
        if (r.band === 5) entry.shrub += r.value;
        if (r.band === 6) entry.tree += r.value;
    }

    return Array.from(map.entries()).map(([yr, v]) => ({ year: yr, shrub: v.shrub, tree: v.tree, coverage: v.coverage }));
}

export default fetchRap;
