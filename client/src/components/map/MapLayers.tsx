import L from "leaflet";
import { useCallback, useMemo } from "react";
import { GeoJSON, Pane } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { queryKeys } from "../../api/queryKeys";
import { fetchWatersheds } from "../../api/api";
import { useRunId } from "../../hooks/useRunId";
import { useWatershed } from "../../contexts/WatershedContext";
import { LAYER_REGISTRY } from "../../layers/registry";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useScenarioData } from "../../hooks/useScenarioData";
import { useRhessysChoropleth } from "../../hooks/useRhessysChoropleth";
import { useSubcatchmentData } from "../../hooks/useSubcatchmentData";
import { useChannelData } from "../../hooks/useChannelData";
import { useLanduseData } from "../../hooks/useLanduseData";
import { getLayerParams } from "../../layers/types";
import { MapEffect } from "../../utils/map/MapEffectUtil";
import { selectedStyle, defaultStyle } from "./constants";
import { buildHillslopeTooltip } from "../../utils/tooltipContent";
import type { PathOptions, LeafletMouseEvent } from "leaflet";
import type { SubcatchmentProperties } from "../../types/SubcatchmentProperties";
import type { WatershedProperties } from "../../types/WatershedProperties";
import MapLoadingOverlay from "./MapLoadingOverlay";
import SubcatchmentLayer from "./SubcatchmentLayer";
import SbsLayer from "./SbsLayer";
import RhessysSpatialLayer from "./RhessysSpatialLayer";
import RhessysOutputLayer from "./RhessysOutputLayer";
import RhessysChoroplethLayer from "./RhessysChoroplethLayer";

const CHANNEL_STYLE: PathOptions = {
  color: "#000080",
  fillOpacity: 1,
  weight: 2,
};

export default function MapLayers() {
  const navigate = useNavigate();
  const runId = useRunId();

  const { layerDesired, effective, isEffective } = useWatershed();

  const { data: watersheds, isLoading: watershedsLoading } = useQuery({
    queryKey: queryKeys.watersheds.all,
    queryFn: fetchWatersheds,
  });

  const { subcatchments, subLoading } = useSubcatchmentData(runId);
  const { channelData, channelLoading } = useChannelData(runId);
  const { landuseData, landuseLoading } = useLanduseData(runId);

  const {
    isActive: choroplethActive,
    isLoading: choroplethLoading,
    getChoroplethStyle,
  } = useChoropleth();

  const {
    isLoading: scenarioLoading,
    getScenarioStyle,
    getScenarioRow,
  } = useScenarioData();

  const {
    isActive: rhessysChoroplethActive,
    isLoading: rhessysChoroplethLoading,
    geometry: rhessysChoroplethGeometry,
    getStyle: getRhessysChoroplethStyle,
    spatialScale: rhessysChoroplethScale,
    styleKey: rhessysChoroplethStyleKey,
  } = useRhessysChoropleth();

  const scenarioEffective = isEffective("scenario");
  const subcatchmentEffective = isEffective("subcatchment");
  const channelsEffective = isEffective("channels");
  const sbsEffective = isEffective("sbs");
  const rhessysSpatialEffective = isEffective("rhessysSpatial");
  const rhessysOutputsEffective = isEffective("rhessysOutputs");

  const sbsColorMode = getLayerParams(layerDesired, "sbs").mode ?? "legacy";
  const rhessysSpatialFilename = getLayerParams(
    layerDesired,
    "rhessysSpatial",
  ).filename;
  const rhessysOutputsParams = getLayerParams(layerDesired, "rhessysOutputs");

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

  const isLoading = [
    watershedsLoading,
    subLoading,
    channelLoading,
    choroplethLoading,
    landuseLoading,
    scenarioLoading,
    rhessysChoroplethLoading,
  ].some(Boolean);

  const onWatershedClick = (e: LeafletMouseEvent) => {
    const feature = e.sourceTarget.feature;
    navigate({ to: `/watershed/${feature.id}` });
  };

  return (
    <>
      <MapLoadingOverlay isLoading={isLoading} />

      {watersheds && <MapEffect watershedId={runId} watersheds={watersheds} />}

      {(!subcatchmentEffective || !subcatchments?.features?.length) &&
        watersheds && (
          <GeoJSON
            data={watersheds}
            style={watershedStyle}
            onEachFeature={(_, layer) => layer.on({ click: onWatershedClick })}
          />
        )}

      {subcatchmentEffective && subcatchments?.features?.length && (
        <SubcatchmentLayer
          data={subcatchments}
          style={subcatchmentStyle}
          coverageActive={choroplethActive || scenarioEffective}
          tooltipContent={tooltipContent}
        />
      )}

      {channelsEffective && channelData && (
        <Pane
          name="channelsPane"
          style={{ zIndex: LAYER_REGISTRY.channels.zIndex }}
        >
          <GeoJSON data={channelData} style={CHANNEL_STYLE} />
        </Pane>
      )}

      {sbsEffective && runId && (
        <SbsLayer
          runId={runId}
          mode={sbsColorMode}
          opacity={effective.sbs.opacity}
          bounds={sbsBounds}
        />
      )}

      {rhessysSpatialEffective && runId && rhessysSpatialFilename && (
        <RhessysSpatialLayer
          runId={runId}
          filename={rhessysSpatialFilename}
          opacity={effective.rhessysSpatial.opacity}
          bounds={sbsBounds}
        />
      )}

      {rhessysOutputsEffective &&
        runId &&
        rhessysOutputsParams.scenario &&
        rhessysOutputsParams.variable &&
        rhessysOutputsParams.mode !== "choropleth" && (
          <RhessysOutputLayer
            runId={runId}
            scenario={rhessysOutputsParams.scenario}
            variable={rhessysOutputsParams.variable}
            opacity={effective.rhessysOutputs.opacity}
            bounds={sbsBounds}
          />
        )}

      {rhessysChoroplethActive && rhessysChoroplethGeometry && (
        <RhessysChoroplethLayer
          geometry={rhessysChoroplethGeometry}
          getStyle={getRhessysChoroplethStyle}
          spatialScale={rhessysChoroplethScale}
          opacity={effective.rhessysOutputs.opacity}
          styleKey={rhessysChoroplethStyleKey}
        />
      )}
    </>
  );
}
