import { API_ENDPOINTS } from './apiEndpoints';

export const DEFAULT_RUN_ID = 'or,wa-108';
export const BATCH_PREFIX = 'batch;;nasa-roses-2025;;';

/**
 * Build the run path for the query engine.
 * Handles both raw run IDs and pre-formatted batch paths.
 * 
 * @param runIdOrPath - Optional run ID or full batch path
 * @param defaultRunId - Fallback run ID if none provided
 * @returns Formatted batch path for the query engine
 */
export function buildRunPath(runIdOrPath?: string, defaultRunId: string = DEFAULT_RUN_ID): string {
    if (runIdOrPath) {
        const sanitized = String(runIdOrPath);
        // Prevent path traversal attacks
        if (sanitized.includes('..') || sanitized.includes('//')) {
            throw new Error('Invalid run path');
        }
        return sanitized.startsWith('batch;;')
            ? sanitized
            : `${BATCH_PREFIX}${sanitized}`;
    }
    return `${BATCH_PREFIX}${defaultRunId}`;
}

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
