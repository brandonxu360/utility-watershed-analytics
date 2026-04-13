import { useMemo, useCallback } from "react";
import { PathOptions } from "leaflet";
import { useLayerQuery } from "./useLayerQuery";

import {
  useChoroplethData,
  type ChoroplethType,
  CHOROPLETH_CONFIG,
} from "./useChoroplethData";

import { createColormap, normalizeValue, ColorArray } from "../utils/colormap";

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
    isLoading,
    error: choroplethError,
    range: choroplethRange,
    isActive,
    config,
    getColor,
    getChoroplethStyle,
  };
}

export default useChoropleth;
