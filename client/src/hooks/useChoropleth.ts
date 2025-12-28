import { useEffect, useMemo, useCallback } from 'react';
import { PathOptions } from 'leaflet';
import { useWatershedOverlayStore, ChoroplethType } from '../store/WatershedOverlayStore';
import { fetchRapChoropleth } from '../api/rapApi';
import { createColormap, normalizeValue, computeRobustRange, ColorArray } from '../utils/colormap';
import { DEFAULT_RUN_ID } from '../api/queryUtils';

export const CHOROPLETH_CONFIG: Record<Exclude<ChoroplethType, 'none'>, {
    title: string;
    unit: string;
    colormap: string;
    bands: number[];
}> = {
    evapotranspiration: {
        title: 'Vegetation Cover',
        unit: '% cover',
        colormap: 'viridis',
        bands: [1, 4, 5, 6],
    },
    soilMoisture: {
        title: 'Shrub Cover',
        unit: '% cover',
        colormap: 'winter',
        bands: [5],
    },
};

export const CHOROPLETH_YEARS: number[] = Array.from(
    { length: 2023 - 1986 + 1 },
    (_, i) => 1986 + i
);

export type ChoroplethStyleFn = (id: number | undefined) => PathOptions | null;

interface UseChoroplethResult {
    choropleth: ChoroplethType;
    isLoading: boolean;
    error: string | null;
    getColor: (id: number | undefined) => string | null;
    getChoroplethStyle: ChoroplethStyleFn;
    isActive: boolean;
    config: typeof CHOROPLETH_CONFIG[keyof typeof CHOROPLETH_CONFIG] | null;
}

export function useChoropleth(): UseChoroplethResult {
    const {
        choropleth,
        choroplethYear,
        choroplethData,
        choroplethRange,
        choroplethLoading,
        choroplethError,
        setChoroplethData,
        setChoroplethLoading,
        setChoroplethError,
    } = useWatershedOverlayStore();

    const config = choropleth !== 'none' ? CHOROPLETH_CONFIG[choropleth] : null;

    useEffect(() => {
        if (choropleth === 'none' || !config) {
            setChoroplethData(null, null);
            return;
        }

        let mounted = true;

        async function loadData() {
            setChoroplethLoading(true);
            setChoroplethError(null);

            try {
                const data = await fetchRapChoropleth({
                    runIdOrPath: DEFAULT_RUN_ID,
                    band: config!.bands,
                    year: choroplethYear,
                });

                if (!mounted) return;

                const dataMap = new globalThis.Map<number, number>();
                const values: number[] = [];

                for (const row of data) {
                    if (Number.isFinite(row.value)) {
                        dataMap.set(row.wepp_id, row.value);
                        values.push(row.value);
                    }
                }

                // Handle empty or invalid data
                if (values.length === 0) {
                    setChoroplethData(null, null);
                    setChoroplethError('No valid data available for the selected options');
                    setChoroplethLoading(false);
                    return;
                }

                const range = computeRobustRange(values, 0.02, 0.98);

                setChoroplethData(dataMap, range);
                setChoroplethLoading(false);
            } catch (err: unknown) {
                if (!mounted) return;
                const message = err instanceof Error ? err.message : String(err);
                setChoroplethError(`Failed to load data: ${message}`);
                setChoroplethLoading(false);
            }
        }

        loadData();
        return () => { mounted = false; };
    }, [choropleth, choroplethYear, config, setChoroplethData, setChoroplethLoading, setChoroplethError]);

    const colormap = useMemo(() => {
        if (!config) return null;
        return createColormap({ colormap: config.colormap, nshades: 256, format: 'hex' }) as ColorArray;
    }, [config]);

    const getColor = useCallback((id: number | undefined): string | null => {
        if (
            choropleth === 'none' ||
            !choroplethData ||
            !choroplethRange ||
            !colormap ||
            id === undefined
        ) {
            return null;
        }

        const value = choroplethData.get(id);
        if (value === undefined) return null;

        const normalized = normalizeValue(value, choroplethRange.min, choroplethRange.max);
        return colormap.map(normalized);
    }, [choropleth, choroplethData, choroplethRange, colormap]);

    const getChoroplethStyle = useCallback((id: number | undefined): PathOptions | null => {
        const fillColor = getColor(id);
        if (!fillColor) return null;

        return {
            color: '#2c2c2c',
            weight: 0.75,
            fillColor,
            fillOpacity: 0.85,
        };
    }, [getColor]);

    return {
        choropleth,
        isLoading: choroplethLoading,
        error: choroplethError,
        getColor,
        getChoroplethStyle,
        isActive: choropleth !== 'none',
        config,
    };
}

export default useChoropleth;
