import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { PathOptions } from "leaflet";
import { useRunId } from "./useRunId";
import { useWatershed } from "../contexts/WatershedContext";
import { getLayerParams } from "../layers/types";
import { queryKeys } from "../api/queryKeys";
import { fetchRapChoropleth } from "../api/rapApi";
import { computeRobustRange } from "../utils/colormap";
import { VEGETATION_BANDS } from "../utils/constants";
import type { VegetationBandType } from "../utils/constants";
import { useLayerQuery } from "./useLayerQuery";
import { useColormapStyle } from "./useColormapStyle";

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
  getChoroplethValue: (id: number | undefined) => number | null;
  choroplethBands: VegetationBandType;
  choroplethYear: number | null;
  isActive: boolean;
  config: (typeof CHOROPLETH_CONFIG)[keyof typeof CHOROPLETH_CONFIG] | null;
}

export function useChoropleth(): UseChoroplethResult {
  const runId = useRunId();
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
    isLoading,
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
        { runId: runId!, band: effectiveBands, year: choroplethYear },
        signal,
      ),
    enabled: isEnabled,
  });

  const { choroplethData, range, dataError } = useMemo(() => {
    if (!rawData) {
      return { choroplethData: null, range: null, dataError: null };
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
        range: null,
        dataError: "No valid data available for the selected options",
      };
    }

    return {
      choroplethData: dataMap,
      range: computeRobustRange(values, 0.02, 0.98),
      dataError: null,
    };
  }, [rawData]);

  const error = isError
    ? `Failed to load data: ${queryError instanceof Error ? queryError.message : String(queryError)}`
    : dataError;

  useLayerQuery("choropleth", {
    enabled: isEnabled,
    isLoading,
    hasData: !error && choroplethData != null && choroplethData.size > 0,
  });

  const { getColor, getStyle: getChoroplethStyle } = useColormapStyle(
    choroplethData,
    range,
    config?.colormap ?? "viridis",
  );

  const getColorGuarded = useCallback(
    (id: number | undefined): string | null => {
      if (choroplethType === "none") return null;
      return getColor(id);
    },
    [choroplethType, getColor],
  );

  const getChoroplethValue = useCallback(
    (id: number | undefined): number | null => {
      if (choroplethType === "none" || !choroplethData || id === undefined)
        return null;
      return choroplethData.get(id) ?? null;
    },
    [choroplethType, choroplethData],
  );

  return {
    choropleth: choroplethType,
    isLoading,
    error,
    range,
    isActive: choroplethType !== "none",
    config,
    getColor: getColorGuarded,
    getChoroplethStyle,
    getChoroplethValue,
    choroplethBands: choroplethBands as VegetationBandType,
    choroplethYear: (choroplethYear as number | null) ?? null,
  };
}

export default useChoropleth;
