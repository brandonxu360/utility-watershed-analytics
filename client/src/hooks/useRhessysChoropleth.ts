/**
 * useRhessysChoropleth — fetches aggregated RHESSys output data from the
 * WEPPcloud Query Engine and builds a spatial-ID → colour lookup for
 * Gate Creek dynamic choropleths.
 *
 * Follows the same pattern as useChoropleth.ts (RAP vegetation cover).
 */

import { useMemo, useCallback } from "react";
import { PathOptions } from "leaflet";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useWatershed } from "../contexts/WatershedContext";
import { getLayerParams } from "../layers/types";
import {
  fetchRhessysChoropleth,
  fetchRhessysGeometry,
} from "../api/rhessysOutputsApi";
import {
  createColormap,
  normalizeValue,
  computeRobustRange,
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
  const runId =
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null;

  const { layerDesired, isEffective } = useWatershed();
  const params = getLayerParams(layerDesired, "rhessysOutputs");
  const isActive =
    isEffective("rhessysOutputs") && params.mode === "choropleth";

  const scenario = params.scenario;
  const variable = params.variable;
  const spatialScale = params.spatialScale ?? "hillslope";
  const year = params.year;

  const shouldQuery =
    isActive &&
    !!runId &&
    !!scenario &&
    !!variable &&
    !!year;

  const {
    data: rawData,
    isLoading: dataLoading,
  } = useQuery({
    queryKey: [
      "rhessys-choropleth",
      runId,
      scenario,
      variable,
      spatialScale,
      year,
    ],
    queryFn: () =>
      fetchRhessysChoropleth({
        runId: runId!,
        scenario: scenario!,
        variable: variable!,
        spatialScale,
        year: year!,
      }),
    enabled: shouldQuery,
    staleTime: 1000 * 60 * 10,
  });

  const {
    data: geometry,
    isLoading: geomLoading,
  } = useQuery({
    queryKey: ["rhessys-geometry", runId, spatialScale],
    queryFn: () => fetchRhessysGeometry(runId!, spatialScale),
    enabled: isActive && !!runId,
    staleTime: 1000 * 60 * 60,
  });

  const isLoading = dataLoading || geomLoading;

  const { dataMap, range } = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return { dataMap: null, range: null };
    }

    const map = new Map<number, number>();
    const values: number[] = [];

    for (const row of rawData) {
      map.set(row.spatialId, row.value);
      values.push(row.value);
    }

    return {
      dataMap: map,
      range: computeRobustRange(values, 0.02, 0.98),
    };
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
