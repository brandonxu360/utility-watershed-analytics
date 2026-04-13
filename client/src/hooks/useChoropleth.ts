import { useCallback } from "react";
import { PathOptions } from "leaflet";
import { useLayerQuery } from "./useLayerQuery";
import { useColormapStyle } from "./useColormapStyle";

import {
  useChoroplethData,
  type ChoroplethType,
  CHOROPLETH_CONFIG,
} from "./useChoroplethData";

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
  const {
    isActive,
    isLoading,
    choroplethType,
    config,
    choroplethData,
    range: choroplethRange,
    error: choroplethError,
    isEnabled,
  } = useChoroplethData();

  useLayerQuery("choropleth", {
    enabled: isEnabled,
    isLoading,
    hasData:
      !choroplethError && choroplethData != null && choroplethData.size > 0,
  });

  const { getColor, getStyle: getChoroplethStyle } = useColormapStyle(
    choroplethData,
    choroplethRange,
    config?.colormap ?? "viridis",
  );

  const getColorGuarded = useCallback(
    (id: number | undefined): string | null => {
      if (choroplethType === "none") return null;
      return getColor(id);
    },
    [choroplethType, getColor],
  );

  return {
    choropleth: choroplethType,
    isLoading,
    error: choroplethError,
    range: choroplethRange,
    isActive,
    config,
    getColor: getColorGuarded,
    getChoroplethStyle,
  };
}

export default useChoropleth;
