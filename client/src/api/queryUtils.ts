import { API_ENDPOINTS } from './apiEndpoints';
import { YEAR_BOUNDS, QueryFilter } from './types';

/**
 * Extract rows from various query engine response formats.
 * The query engine can return data in multiple formats depending on configuration.
 */
export function extractRows(json: unknown): unknown[] {
    if (Array.isArray(json)) return json;

    const obj = json as Record<string, unknown>;

    if (Array.isArray(obj.records)) return obj.records;
    if (Array.isArray(obj.rows)) return obj.rows;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray((obj.result as Record<string, unknown>)?.records)) {
        return (obj.result as Record<string, unknown>).records as unknown[];
    }

    return [];
}

/**
 * POST a query to the query engine and return the raw rows.
 * 
 * @param runPath - The batch path for the query
 * @param payload - Query payload object
 * @param errorPrefix - Prefix for error messages (e.g., "RAP", "ET")
 * @returns Array of raw row objects
 * @throws Error if the request fails
 */
export async function postQuery(
    runPath: string,
    payload: unknown,
    errorPrefix: string = 'Query'
): Promise<unknown[]> {
    const url = API_ENDPOINTS.QUERY_RUN(runPath);

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(`${errorPrefix} query failed: ${res.status}`);
    }

    const json = await res.json();
    return extractRows(json);
}

/**
 * Add optional schema/sql flags to a payload object.
 * Mutates the payload in place for convenience.
 */
export function addQueryFlags(
    payload: Record<string, unknown>,
    include_schema?: boolean,
    include_sql?: boolean
): void {
    if (typeof include_schema !== 'undefined') payload.include_schema = include_schema;
    if (typeof include_sql !== 'undefined') payload.include_sql = include_sql;
}

/**
 * Safely convert a value to a finite number, with a fallback.
 */
export function toFiniteNumber(value: unknown, fallback: number = 0): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

/**
 * Check if a year value is valid for query filtering.
 */
export function isValidYear(year: unknown): year is number {
    return typeof year === 'number' &&
        Number.isInteger(year) &&
        year >= YEAR_BOUNDS.min &&
        year <= YEAR_BOUNDS.max;
}

/**
 * Create a year filter if the year is valid, otherwise return null.
 */
export function createYearFilter(year: unknown, column: string = 'rap.year'): QueryFilter | null {
    if (!isValidYear(year)) return null;
    return { column, operator: '=', value: year };
}

/**
 * Create a band filter for valid RAP bands (1-6).
 * Returns a single '=' filter for one band, or 'IN' filter for multiple.
 * Throws if no valid bands are provided.
 */
export function createBandFilter(
    bands: number | number[],
    column: string = 'rap.band'
): QueryFilter {
    const validBands = (Array.isArray(bands) ? bands : [bands])
        .map(Number)
        .filter(b => Number.isInteger(b) && b >= 1 && b <= 6);

    if (validBands.length === 0) {
        throw new Error('Invalid band values provided');
    }

    return validBands.length === 1
        ? { column, operator: '=', value: validBands[0] }
        : { column, operator: 'IN', value: validBands };
}
