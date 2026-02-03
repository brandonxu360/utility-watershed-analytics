import {
    buildRunPath,
    postQuery,
    addQueryFlags,
    toFiniteNumber,
} from './queryUtils';

import {
    OpenETMonthlyOverlayRow,
    OpenETDatasetKeyRow,
    OpenETMonthYearRow,
    OpenETRow,
    OpenETAreaWeightedRow,
    FetchOpenETMonthlyOverlayOptions,
    FetchOpenETDatasetKeysOptions,
    FetchOpenETMonthListOptions,
    FetchOpenETTimeseriesOptions,
    FetchOpenETAreaWeightedOptions,
    QueryFilter,
} from './types';

const OPENET_PARQUET_PATH = 'openet/openet_ts.parquet';
const HILLSLOPES_PARQUET_PATH = 'watershed/hillslopes.parquet';

/**
 * Validate month value (1-12).
 */
function isValidMonth(month: unknown): month is number {
    return typeof month === 'number' &&
        Number.isInteger(month) &&
        month >= 1 &&
        month <= 12;
}

/**
 * Validate year value for OpenET queries.
 */
function isValidYear(year: unknown): year is number {
    return typeof year === 'number' &&
        Number.isInteger(year) &&
        year >= 1900 &&
        year <= 2100;
}

/**
 * Create a dataset key filter for OpenET queries.
 */
function createDatasetKeyFilter(datasetKey: string): QueryFilter {
    if (!datasetKey || typeof datasetKey !== 'string') {
        throw new Error('Invalid dataset key provided');
    }
    return { column: 'openet.dataset_key', op: '=', value: datasetKey };
}

/**
 * Fetch monthly overlay summary for map colors.
 * Returns a single month of ET values per hillslope for the selected dataset.
 * 
 * @param opts - Options including runIdOrPath, datasetKey, year, and month
 * @returns Array of { topaz_id, value } rows
 */
export async function fetchOpenETMonthlyOverlay(
    opts: FetchOpenETMonthlyOverlayOptions
): Promise<OpenETMonthlyOverlayRow[]> {
    const { runIdOrPath, datasetKey, year, month, include_schema, include_sql } = opts;

    if (!isValidYear(year)) {
        throw new Error('Invalid year provided');
    }
    if (!isValidMonth(month)) {
        throw new Error('Invalid month provided');
    }

    const runPath = buildRunPath(runIdOrPath);

    const filters: QueryFilter[] = [
        createDatasetKeyFilter(datasetKey),
        { column: 'openet.year', op: '=', value: year },
        { column: 'openet.month', op: '=', value: month },
    ];

    const payload: Record<string, unknown> = {
        datasets: [{ path: OPENET_PARQUET_PATH, alias: 'openet' }],
        columns: ['openet.topaz_id AS topaz_id', 'openet.value AS value'],
        filters,
    };
    addQueryFlags(payload, include_schema, include_sql);

    const rawRows = await postQuery(runPath, payload, 'OpenET Monthly Overlay');

    return rawRows
        .map((r) => {
            const row = r as Record<string, unknown>;
            return {
                topaz_id: String(row.topaz_id ?? ''),
                value: toFiniteNumber(row.value),
            };
        })
        .filter((r) => r.topaz_id !== '');
}

/**
 * Fetch available OpenET dataset keys.
 * Discovers which OpenET dataset keys are present in the parquet.
 * 
 * @param opts - Options including runIdOrPath
 * @returns Array of { dataset_key } rows
 */
export async function fetchOpenETDatasetKeys(
    opts: FetchOpenETDatasetKeysOptions = {}
): Promise<OpenETDatasetKeyRow[]> {
    const { runIdOrPath, include_schema, include_sql } = opts;

    const runPath = buildRunPath(runIdOrPath);

    const payload: Record<string, unknown> = {
        datasets: [{ path: OPENET_PARQUET_PATH, alias: 'openet' }],
        columns: ['DISTINCT openet.dataset_key AS dataset_key'],
        order_by: ['dataset_key'],
    };
    addQueryFlags(payload, include_schema, include_sql);

    const rawRows = await postQuery(runPath, payload, 'OpenET Dataset Keys');

    return rawRows
        .map((r) => {
            const row = r as Record<string, unknown>;
            return {
                dataset_key: String(row.dataset_key ?? ''),
            };
        })
        .filter((r) => r.dataset_key !== '');
}

/**
 * Fetch available month/year combinations.
 * Discovers available month/year combinations for the month slider.
 * 
 * @param opts - Options including runIdOrPath
 * @returns Array of { year, month } rows sorted by year, month
 */
export async function fetchOpenETMonthList(
    opts: FetchOpenETMonthListOptions = {}
): Promise<OpenETMonthYearRow[]> {
    const { runIdOrPath, include_schema, include_sql } = opts;

    const runPath = buildRunPath(runIdOrPath);

    const payload: Record<string, unknown> = {
        datasets: [{ path: OPENET_PARQUET_PATH, alias: 'openet' }],
        columns: ['DISTINCT openet.year AS year', 'openet.month AS month'],
        order_by: ['year', 'month'],
    };
    addQueryFlags(payload, include_schema, include_sql);

    const rawRows = await postQuery(runPath, payload, 'OpenET Month List');

    return rawRows
        .map((r) => {
            const row = r as Record<string, unknown>;
            return {
                year: toFiniteNumber(row.year),
                month: toFiniteNumber(row.month),
            };
        })
        .filter((r) => isValidYear(r.year) && isValidMonth(r.month));
}

/**
 * Fetch monthly timeseries for a specific hillslope or all hillslopes.
 * Loads full monthly series per hillslope for the selected dataset.
 * 
 * @param opts - Options including runIdOrPath, datasetKey, and optional topazId
 * @returns Array of { topaz_id, year, month, value } rows
 */
export async function fetchOpenETTimeseries(
    opts: FetchOpenETTimeseriesOptions
): Promise<OpenETRow[]> {
    const { runIdOrPath, datasetKey, topazId, include_schema, include_sql } = opts;

    const runPath = buildRunPath(runIdOrPath);

    const filters: QueryFilter[] = [createDatasetKeyFilter(datasetKey)];

    // Optionally filter by topaz_id if provided
    if (topazId !== undefined && topazId !== null) {
        const sanitizedTopazId = String(topazId);
        if (sanitizedTopazId === '') {
            throw new Error('Invalid topazId provided');
        }
        filters.push({ column: 'openet.topaz_id', op: '=', value: sanitizedTopazId });
    }

    const payload: Record<string, unknown> = {
        datasets: [{ path: OPENET_PARQUET_PATH, alias: 'openet' }],
        columns: [
            'openet.topaz_id AS topaz_id',
            'openet.year AS year',
            'openet.month AS month',
            'openet.value AS value',
        ],
        filters,
        order_by: ['year', 'month'],
    };
    addQueryFlags(payload, include_schema, include_sql);

    const rawRows = await postQuery(runPath, payload, 'OpenET Timeseries');

    return rawRows
        .map((r) => {
            const row = r as Record<string, unknown>;
            return {
                topaz_id: String(row.topaz_id ?? ''),
                year: toFiniteNumber(row.year),
                month: toFiniteNumber(row.month),
                value: toFiniteNumber(row.value),
            };
        })
        .filter((r) => r.topaz_id !== '' && isValidYear(r.year) && isValidMonth(r.month));
}

/**
 * Fetch yearly area-weighted ET aggregation.
 * Aggregates ET using hillslope area to build water-year or calendar-year curves.
 * 
 * @param opts - Options including runIdOrPath and datasetKey
 * @returns Array of { year, month, area_weighted } rows
 */
export async function fetchOpenETAreaWeighted(
    opts: FetchOpenETAreaWeightedOptions
): Promise<OpenETAreaWeightedRow[]> {
    const { runIdOrPath, datasetKey, include_schema, include_sql } = opts;

    const runPath = buildRunPath(runIdOrPath);

    const payload: Record<string, unknown> = {
        datasets: [
            { path: OPENET_PARQUET_PATH, alias: 'openet' },
            { path: HILLSLOPES_PARQUET_PATH, alias: 'hill' },
        ],
        joins: [{ left: 'openet', right: 'hill', on: ['topaz_id'], type: 'inner' }],
        columns: ['openet.year AS year', 'openet.month AS month'],
        aggregations: [
            { expression: 'SUM(openet.value * hill.area)', alias: 'area_weighted' },
        ],
        filters: [createDatasetKeyFilter(datasetKey)],
        group_by: ['openet.year', 'openet.month'],
        order_by: ['year', 'month'],
    };
    addQueryFlags(payload, include_schema, include_sql);

    const rawRows = await postQuery(runPath, payload, 'OpenET Area Weighted');

    return rawRows
        .map((r) => {
            const row = r as Record<string, unknown>;
            return {
                year: toFiniteNumber(row.year),
                month: toFiniteNumber(row.month),
                area_weighted: toFiniteNumber(row.area_weighted),
            };
        })
        .filter((r) => isValidYear(r.year) && isValidMonth(r.month));
}
