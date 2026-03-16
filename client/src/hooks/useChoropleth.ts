import { useMemo, useCallback } from "react";
import { PathOptions } from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { useRunId } from "./useRunId";
import { queryKeys } from "../api/queryKeys";
import { useWatershed } from "../contexts/WatershedContext";
import { useLayerQuery } from "./useLayerQuery";
import { getLayerParams } from "../layers/types";
import { fetchRapChoropleth } from "../api/rapApi";

import {
  createColormap,
  normalizeValue,
  computeRobustRange,
  ColorArray,
} from "../utils/colormap";

import { VEGETATION_BANDS } from "../utils/constants";
import type { VegetationBandType } from "../utils/constants";

export type ChoroplethType = "none" | "vegetationCover";

export const CHOROPLETH_CONFIG: Record<
  Exclude<ChoroplethType, "none">,
  {
    title: string;
    unit: string;
    colormap: string;
    bands: number[];
  }
> = {
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
  const runId = useRunId();

  // Read control fields from the layer desired-state
  const { layerDesired } = useWatershed();
  const choroplethDesired = layerDesired.choropleth;
  const params = getLayerParams(layerDesired, "choropleth");
  const choroplethType: ChoroplethType = choroplethDesired.enabled
    ? (params.metric ?? "none")
    : "none";
  const choroplethYear = params.year;
  const choroplethBands = params.bands ?? "all";

  const config =
    choroplethType !== "none" ? CHOROPLETH_CONFIG[choroplethType] : null;

  const effectiveBands = useMemo(() => {
    if (!config) return [];
    if (choroplethType === "vegetationCover") {
      return VEGETATION_BANDS[choroplethBands as VegetationBandType];
    }
    return config.bands;
  }, [config, choroplethType, choroplethBands]);

  const isEnabled =
    choroplethType !== "none" && !!runId && effectiveBands.length > 0;

  const {
    data: rawData,
    isLoading: choroplethLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.rapChoropleth.byParams(
      runId ?? "",
      choroplethType,
      choroplethYear,
      effectiveBands,
    ),
    queryFn: ({ signal }) =>
      fetchRapChoropleth(
        {
          runId: runId!, // guaranteed non-null by enabled
          band: effectiveBands,
          year: choroplethYear,
        },
        signal,
      ),
    enabled: isEnabled,
  });

  const { choroplethData, choroplethRange, dataError } = useMemo(() => {
    if (!rawData) {
      return { choroplethData: null, choroplethRange: null, dataError: null };
    }

    const dataMap = new Map<number, number>();
    const values: number[] = [];

    for (const row of rawData) {
      if (Number.isFinite(row.value)) {
        dataMap.set(row.wepp_id, row.value);
        values.push(row.value);
      }
    }

    if (values.length === 0) {
      return {
        choroplethData: null,
        choroplethRange: null,
        dataError: "No valid data available for the selected options",
      };
    }

    const range = computeRobustRange(values, 0.02, 0.98);
    return { choroplethData: dataMap, choroplethRange: range, dataError: null };
  }, [rawData]);

  const choroplethError = isError
    ? `Failed to load data: ${queryError instanceof Error ? queryError.message : String(queryError)}`
    : dataError;

  useLayerQuery("choropleth", {
    enabled: isEnabled,
    isLoading: choroplethLoading,
    hasData:
      !choroplethError && choroplethData != null && choroplethData.size > 0,
  });

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
