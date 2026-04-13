import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRunId } from "./useRunId";
import { queryKeys } from "../api/queryKeys";
import { useWatershed } from "../contexts/WatershedContext";
import { getLayerParams } from "../layers/types";
import { fetchRapChoropleth } from "../api/rapApi";
import { computeRobustRange } from "../utils/colormap";
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

export interface UseChoroplethDataResult {
  isActive: boolean;
  isLoading: boolean;
  choroplethType: ChoroplethType;
  config: (typeof CHOROPLETH_CONFIG)[keyof typeof CHOROPLETH_CONFIG] | null;
  /** Resolved data map: weppId → value. Null while loading or on error. */
  choroplethData: Map<number, number> | null;
  range: { min: number; max: number } | null;
  error: string | null;
  /** Whether the underlying query is currently gated on. */
  isEnabled: boolean;
  effectiveBands: number[];
}

export function useChoroplethData(): UseChoroplethDataResult {
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
        {
          runId: runId!,
          band: effectiveBands,
          year: choroplethYear,
        },
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

  return {
    isActive: choroplethType !== "none",
    isLoading,
    choroplethType,
    config,
    choroplethData,
    range,
    error,
    isEnabled,
    effectiveBands,
  };
}
