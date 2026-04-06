import L from "leaflet";
import { useCallback, useMemo } from "react";
import { useWatershed } from "../contexts/WatershedContext";
import { selectedStyle, defaultStyle } from "../components/map/constants";
import { buildHillslopeTooltip } from "../utils/tooltipContent";
import { getLayerParams } from "../layers/types";
import type { PathOptions } from "leaflet";
import type { SubcatchmentProperties } from "../types/SubcatchmentProperties";
import type {
  WatershedProperties,
  WatershedCollection,
} from "../types/WatershedProperties";
import type { LanduseMap } from "../api/types";
import type { ScenarioDataRow } from "../layers/scenario";
import type { ChoroplethStyleFn } from "./useChoropleth";
import type { DesiredMap } from "../layers/types";

const CHANNEL_STYLE: PathOptions = {
  color: "#000080",
  fillOpacity: 1,
  weight: 2,
};

interface UseLayerStylesInput {
  runId: string | null;
  watersheds: WatershedCollection | undefined;
  choroplethActive: boolean;
  scenarioEffective: boolean;
  hasScenarioData: boolean;
  layerDesired: DesiredMap;
  getChoroplethStyle: ChoroplethStyleFn;
  getScenarioStyle: (weppid: number | undefined) => PathOptions | null;
  getScenarioRow: (weppid: number | undefined) => ScenarioDataRow | null;
  landuseData: LanduseMap | undefined;
}

export function useLayerStyles({
  runId,
  watersheds,
  choroplethActive,
  scenarioEffective,
  hasScenarioData,
  layerDesired,
  getChoroplethStyle,
  getScenarioStyle,
  getScenarioRow,
  landuseData,
}: UseLayerStylesInput) {
  const { isEffective } = useWatershed();

  const landuseEffective = isEffective("landuse");
  const anyRasterActive =
    isEffective("sbs") ||
    isEffective("rhessysSpatial") ||
    isEffective("rhessysOutputs");

  const watershedStyle = useCallback(
    (
      feature:
        | GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>
        | undefined,
    ): PathOptions => {
      const base =
        feature?.id?.toString() === runId ? selectedStyle : defaultStyle;
      if (anyRasterActive) {
        return { ...base, fillOpacity: 0 };
      }
      return base;
    },
    [runId, anyRasterActive],
  );

  const subcatchmentStyle = useCallback(
    (
      feature:
        | GeoJSON.Feature<GeoJSON.Geometry, SubcatchmentProperties>
        | undefined,
    ): PathOptions => {
      if (choroplethActive && feature?.properties?.weppid) {
        const choroplethStyle = getChoroplethStyle(feature.properties.weppid);
        if (choroplethStyle) return choroplethStyle;
      }

      if (feature?.properties?.weppid) {
        const scenarioStyle = getScenarioStyle(feature.properties.weppid);
        if (scenarioStyle) return scenarioStyle;
      }

      if (landuseEffective && feature?.properties?.topazid) {
        const landuseInfo = landuseData?.[feature.properties.topazid];
        if (landuseInfo?.color) {
          return {
            color: "#2c2c2c",
            weight: 0.75,
            fillColor: landuseInfo.color,
            fillOpacity: 1,
          };
        }
      }

      return {
        color: "#ffff00",
        weight: 1,
        fillOpacity: 0,
      };
    },
    [
      landuseEffective,
      landuseData,
      choroplethActive,
      getChoroplethStyle,
      getScenarioStyle,
    ],
  );

  const tooltipContent = useCallback(
    (props: Partial<SubcatchmentProperties>) =>
      buildHillslopeTooltip(props, getScenarioRow(props.weppid)),
    [getScenarioRow],
  );

  const sbsBounds = useMemo((): L.LatLngBoundsExpression | undefined => {
    if (!runId || !watersheds) return undefined;
    const feature = watersheds.features?.find(
      (f: GeoJSON.Feature) => f.id?.toString() === runId,
    );
    if (!feature) return undefined;
    try {
      return L.geoJSON(feature).getBounds();
    } catch {
      return undefined;
    }
  }, [runId, watersheds]);

  // Key that changes when any coverage styling input changes,
  // forcing SubcatchmentLayer to re-apply styles.
  const { metric, year, bands } = getLayerParams(layerDesired, "choropleth");
  const { scenario, variable } = getLayerParams(layerDesired, "scenario");
  const coverageKey = `${choroplethActive}|${metric}|${year}|${bands}|${scenarioEffective}|${hasScenarioData}|${scenario}|${variable}|${landuseEffective}|${!!landuseData}`;

  return {
    watershedStyle,
    subcatchmentStyle,
    tooltipContent,
    channelStyle: CHANNEL_STYLE,
    sbsBounds,
    coverageKey,
  };
}
