import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRap, fetchRapChoropleth } from '../api/rapApi';
import * as queryUtils from '../api/queryUtils';

vi.mock('../api/queryUtils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api/queryUtils')>();
    return {
        ...actual,
        postQuery: vi.fn().mockResolvedValue([]),
    };
});

const mockPostQuery = vi.mocked(queryUtils.postQuery);

// Test run path used for all tests
const TEST_RUN_PATH = 'batch;;test-batch;;test-run';

describe('rapApi validation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPostQuery.mockResolvedValue([]);
    });

    describe('fetchRap - hillslope mode validation', () => {
        it('throws error when topazId is missing in hillslope mode', async () => {
            await expect(fetchRap({ mode: 'hillslope', runId: TEST_RUN_PATH })).rejects.toThrow('topazId required for hillslope mode');
        });

        it('throws error for negative topazId', async () => {
            await expect(fetchRap({ mode: 'hillslope', topazId: -1, runId: TEST_RUN_PATH })).rejects.toThrow('Invalid topazId provided');
        });

        it('throws error for non-integer topazId', async () => {
            await expect(fetchRap({ mode: 'hillslope', topazId: 1.5, runId: TEST_RUN_PATH })).rejects.toThrow('Invalid topazId provided');
        });

        it('accepts valid positive integer topazId', async () => {
            await expect(fetchRap({ mode: 'hillslope', topazId: 100, runId: TEST_RUN_PATH })).resolves.not.toThrow();
            expect(mockPostQuery).toHaveBeenCalled();
        });

        it('accepts topazId of 0', async () => {
            await expect(fetchRap({ mode: 'hillslope', topazId: 0, runId: TEST_RUN_PATH })).resolves.not.toThrow();
        });

        it('ignores invalid year values silently', async () => {
            await fetchRap({ mode: 'hillslope', topazId: 100, year: 999, runId: TEST_RUN_PATH });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; value: unknown }>;
            // Should only have topazId filter, not year
            expect(filters.length).toBe(1);
            expect(filters[0].column).toBe('rap.topaz_id');
        });

        it('includes valid year in filters', async () => {
            await fetchRap({ mode: 'hillslope', topazId: 100, year: 2020, runId: TEST_RUN_PATH });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; value: unknown }>;
            expect(filters.length).toBe(2);
            expect(filters[1].column).toBe('rap.year');
            expect(filters[1].value).toBe(2020);
        });
    });

    describe('fetchRap - watershed mode validation', () => {
        it('throws error when weppId is missing in watershed mode', async () => {
            await expect(fetchRap({ mode: 'watershed', runId: TEST_RUN_PATH })).rejects.toThrow('weppId required for watershed mode');
        });

        it('throws error for negative weppId', async () => {
            await expect(fetchRap({ mode: 'watershed', weppId: -1, runId: TEST_RUN_PATH })).rejects.toThrow('Invalid weppId provided');
        });

        it('throws error for weppId exceeding max value', async () => {
            await expect(fetchRap({ mode: 'watershed', weppId: 1000001, runId: TEST_RUN_PATH })).rejects.toThrow('Invalid weppId provided');
        });

        it('throws error for non-integer weppId', async () => {
            await expect(fetchRap({ mode: 'watershed', weppId: 1.5, runId: TEST_RUN_PATH })).rejects.toThrow('Invalid weppId provided');
        });

        it('accepts valid weppId', async () => {
            await expect(fetchRap({ mode: 'watershed', weppId: 108, runId: TEST_RUN_PATH })).resolves.not.toThrow();
        });

        it('accepts boundary weppId values', async () => {
            await expect(fetchRap({ mode: 'watershed', weppId: 0, runId: TEST_RUN_PATH })).resolves.not.toThrow();
            await expect(fetchRap({ mode: 'watershed', weppId: 1000000, runId: TEST_RUN_PATH })).resolves.not.toThrow();
        });

        it('validates year in parameterized filters', async () => {
            await fetchRap({ mode: 'watershed', weppId: 108, year: 2020, runId: TEST_RUN_PATH });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; operator: string; value: unknown }>;
            // Year should appear in filters array, not SQL expression
            const yearFilter = filters.find(f => f.column === 'rap.year');
            expect(yearFilter).toBeDefined();
            expect(yearFilter?.value).toBe(2020);
        });

        it('excludes invalid year from parameterized filters', async () => {
            await fetchRap({ mode: 'watershed', weppId: 108, year: 3000, runId: TEST_RUN_PATH });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; operator: string; value: unknown }>;
            // Invalid year should not appear in filters
            const yearFilter = filters.find(f => f.column === 'rap.year');
            expect(yearFilter).toBeUndefined();
        });
    });

    describe('fetchRapChoropleth - band validation', () => {
        it('throws error for empty band array', async () => {
            await expect(fetchRapChoropleth({ band: [], runId: TEST_RUN_PATH })).rejects.toThrow('Invalid band values provided');
        });

        it('throws error for invalid band values', async () => {
            await expect(fetchRapChoropleth({ band: [0], runId: TEST_RUN_PATH })).rejects.toThrow('Invalid band values provided');
            await expect(fetchRapChoropleth({ band: [7], runId: TEST_RUN_PATH })).rejects.toThrow('Invalid band values provided');
            await expect(fetchRapChoropleth({ band: [-1], runId: TEST_RUN_PATH })).rejects.toThrow('Invalid band values provided');
        });

        it('accepts valid single band', async () => {
            await expect(fetchRapChoropleth({ band: 5, runId: TEST_RUN_PATH })).resolves.not.toThrow();
        });

        it('accepts valid band array', async () => {
            await expect(fetchRapChoropleth({ band: [1, 4, 5, 6], runId: TEST_RUN_PATH })).resolves.not.toThrow();
        });

        it('filters out invalid bands from mixed array', async () => {
            await fetchRapChoropleth({ band: [0, 1, 7, 5, -1], runId: TEST_RUN_PATH });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; operator: string; value: unknown }>;
            // Should only include valid bands 1 and 5 in the filters
            const bandFilter = filters.find(f => f.column === 'rap.band');
            expect(bandFilter).toBeDefined();
            expect(bandFilter?.operator).toBe('IN');
            expect(bandFilter?.value).toEqual([1, 5]);
        });

        it('accepts all valid RAP bands (1-6)', async () => {
            for (let band = 1; band <= 6; band++) {
                mockPostQuery.mockClear();
                await fetchRapChoropleth({ band, runId: TEST_RUN_PATH });
                expect(mockPostQuery).toHaveBeenCalled();
            }
        });
    });

    describe('fetchRapChoropleth - year validation', () => {
        it('excludes year outside valid range from filters', async () => {
            await fetchRapChoropleth({ band: 5, year: 1800, runId: TEST_RUN_PATH });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; operator: string; value: unknown }>;
            const yearFilter = filters.find(f => f.column === 'rap.year');
            expect(yearFilter).toBeUndefined();
        });

        it('excludes future year from filters', async () => {
            await fetchRapChoropleth({ band: 5, year: 2200, runId: TEST_RUN_PATH });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; operator: string; value: unknown }>;
            const yearFilter = filters.find(f => f.column === 'rap.year');
            expect(yearFilter).toBeUndefined();
        });

        it('includes valid year in parameterized filters', async () => {
            await fetchRapChoropleth({ band: 5, year: 2020, runId: TEST_RUN_PATH });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; operator: string; value: unknown }>;
            const yearFilter = filters.find(f => f.column === 'rap.year');
            expect(yearFilter).toBeDefined();
            expect(yearFilter?.value).toBe(2020);
        });

        it('handles null year gracefully', async () => {
            await fetchRapChoropleth({ band: 5, year: null, runId: TEST_RUN_PATH });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; operator: string; value: unknown }>;
            const yearFilter = filters.find(f => f.column === 'rap.year');
            expect(yearFilter).toBeUndefined();
        });

        it('accepts boundary year values in filters', async () => {
            await fetchRapChoropleth({ band: 5, year: 1900, runId: TEST_RUN_PATH });
            let payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            let filters = payload.filters as Array<{ column: string; operator: string; value: unknown }>;
            let yearFilter = filters.find(f => f.column === 'rap.year');
            expect(yearFilter?.value).toBe(1900);

            mockPostQuery.mockClear();
            await fetchRapChoropleth({ band: 5, year: 2100, runId: TEST_RUN_PATH });
            payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            filters = payload.filters as Array<{ column: string; operator: string; value: unknown }>;
            yearFilter = filters.find(f => f.column === 'rap.year');
            expect(yearFilter?.value).toBe(2100);
        });
    });

    describe('SQL injection prevention', () => {
        it('uses parameterized filters instead of string interpolation', async () => {
            // Parameters are now in the filters array, not embedded in SQL strings
            await fetchRap({ mode: 'watershed', weppId: 108, year: 2020, runId: TEST_RUN_PATH });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; operator: string; value: unknown }>;
            const aggregations = payload.aggregations as Array<{ expression: string }>;

            // Verify weppId is in filters, not in SQL expression
            const weppFilter = filters.find(f => f.column === 'hillslopes.wepp_id');
            expect(weppFilter).toBeDefined();
            expect(weppFilter?.value).toBe(108);

            // Verify year is in filters, not in SQL expression
            const yearFilter = filters.find(f => f.column === 'rap.year');
            expect(yearFilter).toBeDefined();
            expect(yearFilter?.value).toBe(2020);

            // Verify aggregations don't contain interpolated values
            for (const agg of aggregations) {
                expect(agg.expression).not.toContain('108');
                expect(agg.expression).not.toContain('2020');
                expect(agg.expression).not.toContain('wepp_id =');
            }
        });
    });
});
