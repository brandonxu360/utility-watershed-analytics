/**
 * useRhessysChoropleth — thin wrapper around useRhessysChoroplethData
 * that adds the heavy derivations (dataMap, getStyle, styleKey) needed
 * for rendering the Gate Creek dynamic choropleth on the map.
 *
 * Components that only need isActive / range (e.g. useChoroplethLegend)
 * should import useRhessysChoroplethData directly to avoid the cost of
 * building the Map and style callback.
 */

import { useMemo, useCallback } from "react";
import { PathOptions } from "leaflet";
import { useWatershed } from "../contexts/WatershedContext";
import { getLayerParams } from "../layers/types";
import { useRhessysChoroplethData } from "./useRhessysChoroplethData";
import {
  createColormap,
  normalizeValue,
  type ColorArray,
} from "../utils/colormap";

let _viridis: ColorArray | null = null;
function getViridisColormap(): ColorArray {
  if (!_viridis) {
    _viridis = createColormap({
      colormap: "viridis",
      nshades: 256,
      format: "hex",
    }) as ColorArray;
  }
  return _viridis;
}

export function useRhessysChoropleth() {
  const { isActive, isLoading, rawData, geometry, range, spatialScale } =
    useRhessysChoroplethData();

  const { layerDesired } = useWatershed();
  const params = getLayerParams(layerDesired, "rhessysOutputs");
  const scenario = params.scenario;
  const variable = params.variable;
  const year = params.year;

  const dataMap = useMemo(() => {
    if (!rawData || rawData.length === 0) return null;
    const map = new Map<number, number>();
    for (const row of rawData) {
      map.set(row.spatialId, row.value);
    }
    return map;
  }, [rawData]);

  const getStyle = useCallback(
    (spatialId: number | undefined): PathOptions => {
      if (!dataMap || !range || spatialId === undefined) {
        return { fillOpacity: 0, weight: 0.5, color: "#888" };
      }

      const value = dataMap.get(spatialId);
      if (value === undefined) {
        return { fillOpacity: 0, weight: 0.5, color: "#888" };
      }

      const colormap = getViridisColormap();
      const normalized = normalizeValue(value, range.min, range.max);
      const fillColor = colormap.map(normalized);

      return {
        color: "#2c2c2c",
        weight: 0.75,
        fillColor,
        fillOpacity: 0.85,
      };
    },
    [dataMap, range],
  );

  const styleKey = `${scenario}|${variable}|${spatialScale}|${year}|${range?.min}|${range?.max}`;

  return {
    isActive,
    isLoading,
    geometry,
    dataMap,
    range,
    getStyle,
    spatialScale,
    styleKey,
  };
}
