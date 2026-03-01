import { useEffect, useMemo, useCallback, useState } from "react";
import { PathOptions } from "leaflet";
import { useParams } from "@tanstack/react-router";
import { useWatershed } from "../contexts/WatershedContext";
import { fetchRapChoropleth } from "../api/rapApi";

import {
  createColormap,
  normalizeValue,
  computeRobustRange,
  ColorArray,
} from "../utils/colormap";

import { VEGETATION_BANDS } from "../utils/constants";

/**
 * Choropleth metric types.  "none" means the choropleth layer is off.
 * Kept in this module because useChoropleth is the only consumer that
 * needs the discriminated union.
 */
export type ChoroplethType = "none" | "evapotranspiration" | "vegetationCover";

export const CHOROPLETH_CONFIG: Record<
  Exclude<ChoroplethType, "none">,
  {
    title: string;
    unit: string;
    colormap: string;
    bands: number[];
  }
> = {
  evapotranspiration: {
    title: "Evapotranspiration",
    unit: "% cover",
    colormap: "et-blue",
    bands: [1, 4, 5, 6],
  },
  vegetationCover: {
    title: "Vegetation Cover",
    unit: "% cover",
    colormap: "viridis",
    bands: [5, 6],
  },
};

export const CHOROPLETH_YEARS: number[] = Array.from(
  { length: 2023 - 1986 + 1 },
  (_, i) => 1986 + i,
);

export type ChoroplethStyleFn = (id: number | undefined) => PathOptions | null;

interface UseChoroplethResult {
  choropleth: ChoroplethType;
  isLoading: boolean;
  error: string | null;
  range: { min: number; max: number } | null;
  getColor: (id: number | undefined) => string | null;
  getChoroplethStyle: ChoroplethStyleFn;
  isActive: boolean;
  config: (typeof CHOROPLETH_CONFIG)[keyof typeof CHOROPLETH_CONFIG] | null;
}

export function useChoropleth(): UseChoroplethResult {
  const runId =
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null;

  // Read control fields from the layer desired-state
  const { layerDesired } = useWatershed();
  const choroplethDesired = layerDesired.choropleth;
  const choroplethType = (
    choroplethDesired.enabled
      ? ((choroplethDesired.params.metric as ChoroplethType) ?? "none")
      : "none"
  ) as ChoroplethType;
  const choroplethYear = choroplethDesired.params.year as number | null;
  const choroplethBands = (choroplethDesired.params.bands as string) ?? "all";

  // Local cache — lives as long as the hook's consumer is mounted.
  // When the choropleth layer is disabled, ActiveBottomPanel unmounts
  // VegetationCover → this hook is destroyed → cache is GC'd.
  const [choroplethData, setChoroplethDataLocal] = useState<Map<number, number> | null>(null);
  const [choroplethRange, setChoroplethRangeLocal] = useState<{ min: number; max: number } | null>(null);
  const [choroplethLoading, setChoroplethLoadingLocal] = useState(false);
  const [choroplethError, setChoroplethErrorLocal] = useState<string | null>(null);

  const config =
    choroplethType !== "none" ? CHOROPLETH_CONFIG[choroplethType] : null;

  const effectiveBands = useMemo(() => {
    if (!config) return [];
    if (choroplethType === "vegetationCover") {
      return VEGETATION_BANDS[choroplethBands];
    }
    return config.bands;
  }, [config, choroplethType, choroplethBands]);

  useEffect(() => {
    if (
      choroplethType === "none" ||
      !config ||
      effectiveBands.length === 0 ||
      !runId
    ) {
      setChoroplethDataLocal(null);
      setChoroplethRangeLocal(null);
      return;
    }

    let mounted = true;

    async function loadData() {
      setChoroplethLoadingLocal(true);
      setChoroplethErrorLocal(null);

      try {
        const data = await fetchRapChoropleth({
          runId: runId!,
          band: effectiveBands,
          year: choroplethYear,
        });

        if (!mounted) return;

        const dataMap = new Map<number, number>();
        const values: number[] = [];

        for (const row of data) {
          if (Number.isFinite(row.value)) {
            dataMap.set(row.wepp_id, row.value);
            values.push(row.value);
          }
        }

        // Handle empty or invalid data
        if (values.length === 0) {
          setChoroplethDataLocal(null);
          setChoroplethRangeLocal(null);
          setChoroplethErrorLocal(
            "No valid data available for the selected options",
          );
          setChoroplethLoadingLocal(false);
          return;
        }

        const range = computeRobustRange(values, 0.02, 0.98);

        setChoroplethDataLocal(dataMap);
        setChoroplethRangeLocal(range);
        setChoroplethLoadingLocal(false);
      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setChoroplethErrorLocal(`Failed to load data: ${message}`);
        setChoroplethLoadingLocal(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [
    choroplethType,
    choroplethYear,
    effectiveBands,
    config,
    runId,
  ]);

  const colormap = useMemo(() => {
    if (!config) return null;
    return createColormap({
      colormap: config.colormap,
      nshades: 256,
      format: "hex",
    }) as ColorArray;
  }, [config]);

  const getColor = useCallback(
    (id: number | undefined): string | null => {
      if (
        choroplethType === "none" ||
        !choroplethData ||
        !choroplethRange ||
        !colormap ||
        id === undefined
      ) {
        return null;
      }

      const value = choroplethData.get(id);
      if (value === undefined) return null;

      const normalized = normalizeValue(
        value,
        choroplethRange.min,
        choroplethRange.max,
      );
      return colormap.map(normalized);
    },
    [choroplethType, choroplethData, choroplethRange, colormap],
  );

  const getChoroplethStyle = useCallback(
    (id: number | undefined): PathOptions | null => {
      const fillColor = getColor(id);
      if (!fillColor) return null;

      return {
        color: "#2c2c2c",
        weight: 0.75,
        fillColor,
        fillOpacity: 0.85,
      };
    },
    [getColor],
  );

  return {
    choropleth: choroplethType,
    isLoading: choroplethLoading,
    error: choroplethError,
    range: choroplethRange,
    isActive: choroplethType !== "none",
    config,
    getColor,
    getChoroplethStyle,
  };
}

export default useChoropleth;
