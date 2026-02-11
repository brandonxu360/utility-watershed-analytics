import { startYear, endYear } from '../utils/constants';

import {
    buildRunPath,
    postQuery,
    addQueryFlags,
    toFiniteNumber,
    createYearFilter,
    createBandFilter,
} from './queryUtils';

import {
    AggregatedRapRow,
    FetchRapOptions,
    FetchRapChoroplethOptions,
    RapChoroplethRow,
    RapRow,
    RapTimeseriesPayload,
    QueryFilter
} from './types';

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
    // Validate topazId is a reasonable positive integer
    const validTopazId = Number(topazId);
    if (!Number.isInteger(validTopazId) || validTopazId < 0) {
        throw new Error('Invalid topazId provided');
    }

    const filters: RapTimeseriesPayload['filters'] = [
        { column: 'rap.topaz_id', operator: '=', value: validTopazId }
    ];

    // Add year filter if valid
    const yearFilter = createYearFilter(year);
    if (yearFilter) {
        filters.push(yearFilter);
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
    const { mode, topazId, weppId, runId, year, include_schema, include_sql } = opts;

    const runPath = buildRunPath(runId);

    let payload: Record<string, unknown>;

    if (mode === 'hillslope') {
        if (typeof topazId === 'undefined') throw new Error('topazId required for hillslope mode');
        payload = buildRapTimeseriesPayload(topazId, year);
        addQueryFlags(payload, include_schema, include_sql);
    } else {
        if (typeof weppId === 'undefined') throw new Error('weppId required for watershed mode');

        // Validate weppId is a reasonable positive integer
        const validWeppId = Number(weppId);
        if (!Number.isInteger(validWeppId) || validWeppId < 0 || validWeppId > 1000000) {
            throw new Error('Invalid weppId provided');
        }

        // Build parameterized filters array
        const filters: QueryFilter[] = [
            { column: 'hillslopes.wepp_id', operator: '=', value: validWeppId },
            { column: 'rap.band', operator: 'IN', value: [1, 4, 5, 6] }
        ];

        // Add year filter if valid
        const yearFilter = createYearFilter(year);
        if (yearFilter) {
            filters.push(yearFilter);
        }

        payload = {
            datasets: [
                { path: 'rap/rap_ts.parquet', alias: 'rap' },
                { path: 'watershed/hillslopes.parquet', alias: 'hillslopes' }
            ],
            joins: [{ left: 'rap', right: 'hillslopes', on: ['topaz_id'] }],
            columns: ['rap.year AS year'],
            filters,
            aggregations: [
                { alias: 'shrub', expression: 'SUM(CASE WHEN rap.band = 5 THEN rap.value ELSE 0 END)' },
                { alias: 'tree', expression: 'SUM(CASE WHEN rap.band = 6 THEN rap.value ELSE 0 END)' },
                { alias: 'coverage', expression: 'SUM(rap.value)' }
            ],
            group_by: ['rap.year'],
            order_by: ['rap.year'],
        };
        addQueryFlags(payload, include_schema, include_sql);
    }

    const rawRows = await postQuery(runPath, payload, 'RAP');

    if (mode === 'watershed') {
        // Map server-aggregated rows straight to AggregatedRapRow
        const rows = rawRows
            .map((r) => {
                const row = r as Record<string, unknown>;
                return {
                    year: toFiniteNumber(row.year),
                    shrub: toFiniteNumber(row.shrub),
                    tree: toFiniteNumber(row.tree),
                    coverage: toFiniteNumber(row.coverage ?? row.cover),
                };
            })
            .filter((r) => Number.isFinite(r.year));
        return rows;
    }

    // hillslope: raw band rows -> aggregate client-side to per-year
    const bandRows: RapRow[] = rawRows
        .map((r) => {
            const row = r as Record<string, unknown>;
            return {
                topaz_id: toFiniteNumber(row.topaz_id),
                year: toFiniteNumber(row.year),
                band: toFiniteNumber(row.band),
                value: toFiniteNumber(row.value),
            };
        })
        .filter((r) => Number.isFinite(r.topaz_id) && Number.isFinite(r.year) && Number.isFinite(r.band) && Number.isFinite(r.value));

    const map = new Map<number, { coverage: number; shrub: number; tree: number }>();
    for (let year = startYear; year <= endYear; year++) map.set(year, { coverage: 0, shrub: 0, tree: 0 });

    for (const row of bandRows) {
        const entry = map.get(row.year);
        if (!entry) continue;
        if ([1, 4, 5, 6].includes(row.band)) entry.coverage += row.value;
        if (row.band === 5) entry.shrub += row.value;
        if (row.band === 6) entry.tree += row.value;
    }

    return Array.from(map.entries()).map(([yr, v]) => ({ year: yr, shrub: v.shrub, tree: v.tree, coverage: v.coverage }));
}

export default fetchRap;

/**
 * Fetch RAP values aggregated by watershed (wepp_id) for building a choropleth.
 * If `year` is provided the expression is restricted to that year, otherwise
 * it averages across all years. Returns rows with { wepp_id, value }.
 */
export async function fetchRapChoropleth(opts: FetchRapChoroplethOptions): Promise<RapChoroplethRow[]> {
    const { runId, band, year, include_schema, include_sql } = opts;

    const runPath = buildRunPath(runId);

    // Build parameterized filters array using shared helpers
    const filters: QueryFilter[] = [createBandFilter(band)];

    // Add year filter if valid
    const yearFilter = createYearFilter(year);
    if (yearFilter) {
        filters.push(yearFilter);
    }

    const payload: Record<string, unknown> = {
        datasets: [
            { path: 'rap/rap_ts.parquet', alias: 'rap' },
            { path: 'watershed/hillslopes.parquet', alias: 'hillslopes' }
        ],
        joins: [{ left: 'rap', right: 'hillslopes', on: ['topaz_id'] }],
        columns: ['hillslopes.wepp_id AS wepp_id'],
        filters,
        aggregations: [
            {
                alias: 'value',
                expression: 'AVG(rap.value)'
            }
        ],
        group_by: ['hillslopes.wepp_id'],
        order_by: ['hillslopes.wepp_id'],
    };
    addQueryFlags(payload, include_schema, include_sql);

    const rawRows = await postQuery(runPath, payload, 'RAP Choropleth');

    return rawRows
        .map((r) => {
            const row = r as Record<string, unknown>;
            return {
                wepp_id: toFiniteNumber(row.wepp_id),
                value: toFiniteNumber(row.value ?? row.val),
            };
        })
        .filter((r) => Number.isFinite(r.wepp_id));
}
