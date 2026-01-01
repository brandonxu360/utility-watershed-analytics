import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChoropleth, CHOROPLETH_CONFIG, CHOROPLETH_YEARS } from '../hooks/useChoropleth';
import { useAppStore } from '../store/store';

vi.mock('../api/rapApi', () => ({
    fetchRapChoropleth: vi.fn(),
}));

import { fetchRapChoropleth } from '../api/rapApi';

const mockFetchRapChoropleth = vi.mocked(fetchRapChoropleth);

describe('useChoropleth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAppStore.getState().setChoroplethType('none');
        useAppStore.getState().setChoroplethYear(null);
        useAppStore.getState().setChoroplethData(null, null);
        useAppStore.getState().setChoroplethLoading(false);
        useAppStore.getState().setChoroplethError(null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('CHOROPLETH_CONFIG', () => {
        it('has configuration for evapotranspiration', () => {
            expect(CHOROPLETH_CONFIG.evapotranspiration).toBeDefined();
            expect(CHOROPLETH_CONFIG.evapotranspiration.title).toBe('Evapotranspiration');
            expect(CHOROPLETH_CONFIG.evapotranspiration.colormap).toBe('et-blue');
            expect(CHOROPLETH_CONFIG.evapotranspiration.bands).toEqual([1, 4, 5, 6]);
        });

        it('has configuration for soilMoisture', () => {
            expect(CHOROPLETH_CONFIG.soilMoisture).toBeDefined();
            expect(CHOROPLETH_CONFIG.soilMoisture.title).toBe('Soil Moisture');
            expect(CHOROPLETH_CONFIG.soilMoisture.colormap).toBe('winter');
            expect(CHOROPLETH_CONFIG.soilMoisture.bands).toEqual([2, 3]);
        });

        it('has configuration for vegetationCover', () => {
            expect(CHOROPLETH_CONFIG.vegetationCover).toBeDefined();
            expect(CHOROPLETH_CONFIG.vegetationCover.title).toBe('Vegetation Cover');
            expect(CHOROPLETH_CONFIG.vegetationCover.colormap).toBe('viridis');
            expect(CHOROPLETH_CONFIG.vegetationCover.bands).toEqual([5, 6]);
        });
    });

    describe('CHOROPLETH_YEARS', () => {
        it('generates years from 1986 to 2023', () => {
            expect(CHOROPLETH_YEARS[0]).toBe(1986);
            expect(CHOROPLETH_YEARS[CHOROPLETH_YEARS.length - 1]).toBe(2023);
            expect(CHOROPLETH_YEARS.length).toBe(38);
        });
    });

    describe('hook behavior', () => {
        it('returns inactive state when choropleth is none', () => {
            const { result } = renderHook(() => useChoropleth());

            expect(result.current.isActive).toBe(false);
            expect(result.current.choropleth).toBe('none');
            expect(result.current.config).toBeNull();
        });

        it('returns active state when choropleth is set', async () => {
            mockFetchRapChoropleth.mockResolvedValue([
                { wepp_id: 1, value: 50 },
                { wepp_id: 2, value: 75 },
            ]);

            const { result } = renderHook(() => useChoropleth());

            act(() => {
                useAppStore.getState().setChoroplethType('vegetationCover');
            });

            await waitFor(() => {
                expect(result.current.isActive).toBe(true);
            });

            expect(result.current.choropleth).toBe('vegetationCover');
            expect(result.current.config).toEqual(CHOROPLETH_CONFIG.vegetationCover);
        });

        it('fetches data when choropleth type changes', async () => {
            mockFetchRapChoropleth.mockResolvedValue([
                { wepp_id: 1, value: 50 },
                { wepp_id: 2, value: 75 },
            ]);

            renderHook(() => useChoropleth());

            act(() => {
                useAppStore.getState().setChoroplethType('vegetationCover');
            });

            await waitFor(() => {
                expect(mockFetchRapChoropleth).toHaveBeenCalledWith({
                    runIdOrPath: 'or,wa-108',
                    band: [5, 6],
                    year: null,
                });
            });
        });

        it('fetches data with year filter when year is set', async () => {
            mockFetchRapChoropleth.mockResolvedValue([
                { wepp_id: 1, value: 50 },
            ]);

            renderHook(() => useChoropleth());

            act(() => {
                useAppStore.getState().setChoroplethType('vegetationCover');
                useAppStore.getState().setChoroplethYear(2020);
            });

            await waitFor(() => {
                expect(mockFetchRapChoropleth).toHaveBeenCalledWith({
                    runIdOrPath: 'or,wa-108',
                    band: [5, 6],
                    year: 2020,
                });
            });
        });

        it('sets error state when fetch fails', async () => {
            mockFetchRapChoropleth.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useChoropleth());

            act(() => {
                useAppStore.getState().setChoroplethType('vegetationCover');
            });

            await waitFor(() => {
                expect(result.current.error).toContain('Failed to load data');
            });
        });

        it('sets error when response has no valid data', async () => {
            mockFetchRapChoropleth.mockResolvedValue([]);

            const { result } = renderHook(() => useChoropleth());

            act(() => {
                useAppStore.getState().setChoroplethType('vegetationCover');
            });

            await waitFor(() => {
                expect(result.current.error).toContain('No valid data available');
            });
        });

        it('filters out non-finite values from data', async () => {
            mockFetchRapChoropleth.mockResolvedValue([
                { wepp_id: 1, value: 50 },
                { wepp_id: 2, value: NaN },
                { wepp_id: 3, value: Infinity },
                { wepp_id: 4, value: 75 },
            ]);

            const { result } = renderHook(() => useChoropleth());

            act(() => {
                useAppStore.getState().setChoroplethType('vegetationCover');
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Only valid values (50 and 75) should be in the data
            expect(result.current.getColor(1)).not.toBeNull();
            expect(result.current.getColor(4)).not.toBeNull();
            // Invalid values should not be stored
            expect(result.current.getColor(2)).toBeNull();
            expect(result.current.getColor(3)).toBeNull();
        });

        it('clears data when choropleth is set to none', async () => {
            mockFetchRapChoropleth.mockResolvedValue([
                { wepp_id: 1, value: 50 },
            ]);

            const { result } = renderHook(() => useChoropleth());

            act(() => {
                useAppStore.getState().setChoroplethType('vegetationCover');
            });

            await waitFor(() => {
                expect(result.current.isActive).toBe(true);
            });

            act(() => {
                useAppStore.getState().setChoroplethType('none');
            });

            await waitFor(() => {
                expect(result.current.isActive).toBe(false);
            });
        });
    });

    describe('getColor', () => {
        it('returns null when choropleth is inactive', () => {
            const { result } = renderHook(() => useChoropleth());
            expect(result.current.getColor(1)).toBeNull();
        });

        it('returns null for undefined id', async () => {
            mockFetchRapChoropleth.mockResolvedValue([
                { wepp_id: 1, value: 50 },
            ]);

            const { result } = renderHook(() => useChoropleth());

            act(() => {
                useAppStore.getState().setChoroplethType('vegetationCover');
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.getColor(undefined)).toBeNull();
        });

        it('returns null for unknown id', async () => {
            mockFetchRapChoropleth.mockResolvedValue([
                { wepp_id: 1, value: 50 },
            ]);

            const { result } = renderHook(() => useChoropleth());

            act(() => {
                useAppStore.getState().setChoroplethType('vegetationCover');
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.getColor(999)).toBeNull();
        });

        it('returns a color string for known id', async () => {
            mockFetchRapChoropleth.mockResolvedValue([
                { wepp_id: 1, value: 50 },
                { wepp_id: 2, value: 100 },
            ]);

            const { result } = renderHook(() => useChoropleth());

            act(() => {
                useAppStore.getState().setChoroplethType('vegetationCover');
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const color = result.current.getColor(1);
            expect(color).toBeTruthy();
            expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });

    describe('getChoroplethStyle', () => {
        it('returns null when choropleth is inactive', () => {
            const { result } = renderHook(() => useChoropleth());
            expect(result.current.getChoroplethStyle(1)).toBeNull();
        });

        it('returns style object for known id', async () => {
            mockFetchRapChoropleth.mockResolvedValue([
                { wepp_id: 1, value: 50 },
                { wepp_id: 2, value: 100 },
            ]);

            const { result } = renderHook(() => useChoropleth());

            act(() => {
                useAppStore.getState().setChoroplethType('vegetationCover');
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const style = result.current.getChoroplethStyle(1);
            expect(style).not.toBeNull();
            expect(style).toHaveProperty('color', '#2c2c2c');
            expect(style).toHaveProperty('weight', 0.75);
            expect(style).toHaveProperty('fillColor');
            expect(style).toHaveProperty('fillOpacity', 0.85);
        });
    });
});
