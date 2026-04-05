import { GeoJSON } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { queryKeys } from "../../api/queryKeys";
import { fetchWatersheds } from "../../api/api";
import { useRunId } from "../../hooks/useRunId";
import { useWatershed } from "../../contexts/WatershedContext";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useScenarioData } from "../../hooks/useScenarioData";
import { useRhessysChoropleth } from "../../hooks/useRhessysChoropleth";
import { useSubcatchmentData } from "../../hooks/useSubcatchmentData";
import { useChannelData } from "../../hooks/useChannelData";
import { useLanduseData } from "../../hooks/useLanduseData";
import { useLayerStyles } from "../../hooks/useLayerStyles";
import { getLayerParams } from "../../layers/types";
import { MapEffect } from "../../utils/map/MapEffectUtil";
import type { LeafletMouseEvent } from "leaflet";
import MapLoadingOverlay from "./MapLoadingOverlay";
import SubcatchmentLayer from "./SubcatchmentLayer";
import SbsLayer from "./SbsLayer";
import RhessysSpatialLayer from "./RhessysSpatialLayer";
import RhessysOutputLayer from "./RhessysOutputLayer";
import RhessysChoroplethLayer from "./RhessysChoroplethLayer";

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
    hasData: hasScenarioData,
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
  const rhessysSpatialFilename = getLayerParams(layerDesired, "rhessysSpatial").filename;
  const rhessysOutputsParams = getLayerParams(layerDesired, "rhessysOutputs");

  const { watershedStyle, subcatchmentStyle, tooltipContent, channelStyle, sbsBounds, coverageKey } =
    useLayerStyles({
      runId,
      watersheds,
      choroplethActive,
      scenarioEffective,
      hasScenarioData,
      landuseData,
      layerDesired,
      getChoroplethStyle,
      getScenarioStyle,
      getScenarioRow,
    });

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
            onEachFeature={(_, layer) =>
              layer.on({ click: onWatershedClick })
            }
          />
        )}

      {subcatchmentEffective && subcatchments?.features?.length && (
        <SubcatchmentLayer
          data={subcatchments}
          style={subcatchmentStyle}
          coverageActive={choroplethActive || scenarioEffective}
          coverageKey={coverageKey}
          tooltipContent={tooltipContent}
        />
      )}

      {channelsEffective && channelData && (
        <GeoJSON data={channelData} style={channelStyle} />
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
