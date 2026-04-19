import L from "leaflet";
import { useCallback, useMemo } from "react";
import { useWatershed } from "../contexts/WatershedContext";
import { buildHillslopeTooltip } from "../utils/tooltipContent";
import type { TooltipContext } from "../utils/tooltipContent";
import type { PathOptions } from "leaflet";
import type { SubcatchmentProperties } from "../types/SubcatchmentProperties";

import type { WatershedCollection } from "../types/WatershedProperties";

import type { LanduseMap } from "../api/types/landuse";
import type {
  ScenarioDataRow,
  ScenarioVariableType,
} from "../api/types/scenario";
import type { ChoroplethStyleFn } from "./useChoropleth";
import type { VegetationBandType } from "../utils/constants";

const CHANNEL_STYLE: PathOptions = {
  color: "#000080",
  fillOpacity: 1,
  weight: 2,
};

interface UseLayerStylesInput {
  runId: string | null;
  watersheds: WatershedCollection | undefined;
  choroplethActive: boolean;
  getChoroplethStyle: ChoroplethStyleFn;
  getChoroplethData: (
    weppid: number | undefined,
  ) => { value: number; shrub?: number; tree?: number } | null;
  choroplethBands: VegetationBandType;
  choroplethYear: number | null;
  getScenarioStyle: (weppid: number | undefined) => PathOptions | null;
  getScenarioRow: (weppid: number | undefined) => ScenarioDataRow | null;
  scenarioVariable: ScenarioVariableType;
  landuseData: LanduseMap | undefined;
}

export function useLayerStyles({
  runId,
  watersheds,
  choroplethActive,
  getChoroplethStyle,
  getChoroplethData,
  choroplethBands,
  choroplethYear,
  getScenarioStyle,
  getScenarioRow,
  scenarioVariable,
  landuseData,
}: UseLayerStylesInput) {
  const { isEffective } = useWatershed();

  const landuseEffective = isEffective("landuse");

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
    (props: Partial<SubcatchmentProperties>) => {
      let context: TooltipContext;

      if (choroplethActive && props.weppid !== undefined) {
        const data = getChoroplethData(props.weppid);
        if (data) {
          const components =
            data.shrub !== undefined && data.tree !== undefined
              ? { shrub: data.shrub, tree: data.tree }
              : undefined;
          context = {
            layer: "choropleth",
            bands: choroplethBands,
            year: choroplethYear,
            value: data.value,
            components,
          };
          return buildHillslopeTooltip(props, context);
        }
      }

      const scenarioRow = getScenarioRow(props.weppid);
      if (scenarioRow) {
        context = {
          layer: "scenario",
          variable: scenarioVariable,
          row: scenarioRow,
        };
        return buildHillslopeTooltip(props, context);
      }

      if (landuseEffective && props.topazid !== undefined) {
        const desc = landuseData?.[props.topazid]?.desc;
        if (desc) {
          context = { layer: "landuse", desc };
          return buildHillslopeTooltip(props, context);
        }
      }

      return buildHillslopeTooltip(props, { layer: "none" });
    },
    [
      choroplethActive,
      getChoroplethData,
      choroplethBands,
      choroplethYear,
      getScenarioRow,
      scenarioVariable,
      landuseEffective,
      landuseData,
    ],
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

  return {
    subcatchmentStyle,
    tooltipContent,
    channelStyle: CHANNEL_STYLE,
    sbsBounds,
  };
}
