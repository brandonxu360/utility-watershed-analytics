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

describe('rapApi validation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPostQuery.mockResolvedValue([]);
    });

    describe('fetchRap - hillslope mode validation', () => {
        it('throws error when topazId is missing in hillslope mode', async () => {
            await expect(fetchRap({ mode: 'hillslope' })).rejects.toThrow('topazId required for hillslope mode');
        });

        it('throws error for negative topazId', async () => {
            await expect(fetchRap({ mode: 'hillslope', topazId: -1 })).rejects.toThrow('Invalid topazId provided');
        });

        it('throws error for non-integer topazId', async () => {
            await expect(fetchRap({ mode: 'hillslope', topazId: 1.5 })).rejects.toThrow('Invalid topazId provided');
        });

        it('accepts valid positive integer topazId', async () => {
            await expect(fetchRap({ mode: 'hillslope', topazId: 100 })).resolves.not.toThrow();
            expect(mockPostQuery).toHaveBeenCalled();
        });

        it('accepts topazId of 0', async () => {
            await expect(fetchRap({ mode: 'hillslope', topazId: 0 })).resolves.not.toThrow();
        });

        it('ignores invalid year values silently', async () => {
            await fetchRap({ mode: 'hillslope', topazId: 100, year: 999 });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; value: unknown }>;
            // Should only have topazId filter, not year
            expect(filters.length).toBe(1);
            expect(filters[0].column).toBe('rap.topaz_id');
        });

        it('includes valid year in filters', async () => {
            await fetchRap({ mode: 'hillslope', topazId: 100, year: 2020 });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const filters = payload.filters as Array<{ column: string; value: unknown }>;
            expect(filters.length).toBe(2);
            expect(filters[1].column).toBe('rap.year');
            expect(filters[1].value).toBe(2020);
        });
    });

    describe('fetchRap - watershed mode validation', () => {
        it('throws error when weppId is missing in watershed mode', async () => {
            await expect(fetchRap({ mode: 'watershed' })).rejects.toThrow('weppId required for watershed mode');
        });

        it('throws error for negative weppId', async () => {
            await expect(fetchRap({ mode: 'watershed', weppId: -1 })).rejects.toThrow('Invalid weppId provided');
        });

        it('throws error for weppId exceeding max value', async () => {
            await expect(fetchRap({ mode: 'watershed', weppId: 1000001 })).rejects.toThrow('Invalid weppId provided');
        });

        it('throws error for non-integer weppId', async () => {
            await expect(fetchRap({ mode: 'watershed', weppId: 1.5 })).rejects.toThrow('Invalid weppId provided');
        });

        it('accepts valid weppId', async () => {
            await expect(fetchRap({ mode: 'watershed', weppId: 108 })).resolves.not.toThrow();
        });

        it('accepts boundary weppId values', async () => {
            await expect(fetchRap({ mode: 'watershed', weppId: 0 })).resolves.not.toThrow();
            await expect(fetchRap({ mode: 'watershed', weppId: 1000000 })).resolves.not.toThrow();
        });

        it('validates year in SQL expression', async () => {
            await fetchRap({ mode: 'watershed', weppId: 108, year: 2020 });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const aggregations = payload.aggregations as Array<{ expression: string }>;
            // Year should appear in the expression
            expect(aggregations[0].expression).toContain('rap.year = 2020');
        });

        it('excludes invalid year from SQL expression', async () => {
            await fetchRap({ mode: 'watershed', weppId: 108, year: 3000 });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const aggregations = payload.aggregations as Array<{ expression: string }>;
            // Invalid year should not appear
            expect(aggregations[0].expression).not.toContain('rap.year');
        });
    });

    describe('fetchRapChoropleth - band validation', () => {
        it('throws error for empty band array', async () => {
            await expect(fetchRapChoropleth({ band: [] })).rejects.toThrow('Invalid band values provided');
        });

        it('throws error for invalid band values', async () => {
            await expect(fetchRapChoropleth({ band: [0] })).rejects.toThrow('Invalid band values provided');
            await expect(fetchRapChoropleth({ band: [7] })).rejects.toThrow('Invalid band values provided');
            await expect(fetchRapChoropleth({ band: [-1] })).rejects.toThrow('Invalid band values provided');
        });

        it('accepts valid single band', async () => {
            await expect(fetchRapChoropleth({ band: 5 })).resolves.not.toThrow();
        });

        it('accepts valid band array', async () => {
            await expect(fetchRapChoropleth({ band: [1, 4, 5, 6] })).resolves.not.toThrow();
        });

        it('filters out invalid bands from mixed array', async () => {
            await fetchRapChoropleth({ band: [0, 1, 7, 5, -1] });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const aggregations = payload.aggregations as Array<{ expression: string }>;
            // Should only include valid bands 1 and 5
            expect(aggregations[0].expression).toContain('rap.band IN (1,5)');
        });

        it('accepts all valid RAP bands (1-6)', async () => {
            for (let band = 1; band <= 6; band++) {
                mockPostQuery.mockClear();
                await fetchRapChoropleth({ band });
                expect(mockPostQuery).toHaveBeenCalled();
            }
        });
    });

    describe('fetchRapChoropleth - year validation', () => {
        it('excludes year outside valid range from SQL', async () => {
            await fetchRapChoropleth({ band: 5, year: 1800 });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const aggregations = payload.aggregations as Array<{ expression: string }>;
            expect(aggregations[0].expression).not.toContain('rap.year');
        });

        it('excludes future year from SQL', async () => {
            await fetchRapChoropleth({ band: 5, year: 2200 });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const aggregations = payload.aggregations as Array<{ expression: string }>;
            expect(aggregations[0].expression).not.toContain('rap.year');
        });

        it('includes valid year in SQL expression', async () => {
            await fetchRapChoropleth({ band: 5, year: 2020 });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const aggregations = payload.aggregations as Array<{ expression: string }>;
            expect(aggregations[0].expression).toContain('rap.year = 2020');
        });

        it('handles null year gracefully', async () => {
            await fetchRapChoropleth({ band: 5, year: null });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const aggregations = payload.aggregations as Array<{ expression: string }>;
            expect(aggregations[0].expression).not.toContain('rap.year');
        });

        it('accepts boundary year values', async () => {
            await fetchRapChoropleth({ band: 5, year: 1900 });
            let payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            let aggregations = payload.aggregations as Array<{ expression: string }>;
            expect(aggregations[0].expression).toContain('rap.year = 1900');

            mockPostQuery.mockClear();
            await fetchRapChoropleth({ band: 5, year: 2100 });
            payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            aggregations = payload.aggregations as Array<{ expression: string }>;
            expect(aggregations[0].expression).toContain('rap.year = 2100');
        });
    });

    describe('SQL injection prevention', () => {
        it('uses validated integers in SQL expressions, not raw input', async () => {
            // Even if someone tried to inject, the validation ensures only integers are used
            await fetchRap({ mode: 'watershed', weppId: 108, year: 2020 });
            const payload = mockPostQuery.mock.calls[0][1] as Record<string, unknown>;
            const aggregations = payload.aggregations as Array<{ expression: string }>;

            // The expression should contain clean integer values
            expect(aggregations[0].expression).toMatch(/wepp_id = 108/);
            expect(aggregations[0].expression).toMatch(/rap\.year = 2020/);
        });
    });
});
