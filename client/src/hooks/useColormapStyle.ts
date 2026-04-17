import { useMemo, useCallback } from "react";
import type { PathOptions } from "leaflet";
import {
  createColormap,
  normalizeValue,
  type ColorArray,
} from "../utils/colormap";

export interface UseColormapStyleResult {
  getColor: (id: number | undefined) => string | null;
  getStyle: (id: number | undefined) => PathOptions | null;
}

export function useColormapStyle(
  dataMap: Map<number, number> | null,
  range: { min: number; max: number } | null,
  colormapName: string,
): UseColormapStyleResult {
  const colormap = useMemo<ColorArray | null>(() => {
    if (!range || !colormapName) return null;
    return createColormap({
      colormap: colormapName,
      nshades: 256,
      format: "hex",
    }) as ColorArray;
  }, [colormapName, range]);

  const getColor = useCallback(
    (id: number | undefined): string | null => {
      if (!dataMap || !range || !colormap || id === undefined) return null;

      const value = dataMap.get(id);
      if (value === undefined) return null;

      const normalized = normalizeValue(value, range.min, range.max);
      return colormap.map(normalized);
    },
    [dataMap, range, colormap],
  );

  const getStyle = useCallback(
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

  return { getColor, getStyle };
}
