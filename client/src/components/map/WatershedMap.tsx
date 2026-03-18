import { useCallback, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, ScaleControl } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { useNavigate } from "@tanstack/react-router";
import { useRunId } from "../../hooks/useRunId";
import { MapEffect, getSavedMapView } from "../../utils/map/MapEffectUtil";
import { fetchWatersheds } from "../../api/api";
import { SubcatchmentProperties } from "../../types/SubcatchmentProperties";
import { WatershedProperties } from "../../types/WatershedProperties";
import { LeafletMouseEvent } from "leaflet";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useScenarioData } from "../../hooks/useScenarioData";
import { selectedStyle, defaultStyle } from "./constants";
import { tss } from "../../utils/tss";
import { CircularProgress } from "@mui/material";
import { useWatershed } from "../../contexts/WatershedContext";
import { useLanduseData } from "../../hooks/useLanduseData";
import { useSubcatchmentData } from "../../hooks/useSubcatchmentData";
import { useChannelData } from "../../hooks/useChannelData";
import { useLayerToasts } from "../../hooks/useLayerToasts";
import ZoomInControl from "./controls/ZoomIn";
import ZoomOutControl from "./controls/ZoomOut";
import LayersControl from "./controls/Layers";
import SearchControl from "./controls/Search";
import SbsLegend from "./controls/SbsLegend";
import SbsLayer from "./SbsLayer";
import RhessysSpatialLayer from "./RhessysSpatialLayer";
import RhessysOutputLayer from "./RhessysOutputLayer";
import RhessysChoroplethLayer from "./RhessysChoroplethLayer";
import { useRhessysChoropleth } from "../../hooks/useRhessysChoropleth";
import ChoroplethLegend from "./controls/ChoroplethLegend";
import SubcatchmentLayer from "./SubcatchmentLayer";
import { buildHillslopeTooltip } from "../../utils/tooltipContent";
import { useChoroplethLegend } from "../../hooks/useChoroplethLegend";
import { getLayerParams } from "../../layers/types";
import "leaflet/dist/leaflet.css";

const useStyles = tss.create(({ theme }) => ({
  mapContainer: {
    height: "100%",
    width: "100%",
  },
  mapContainerWithPanel: {
    "& .leaflet-bottom": {
      marginBottom: "24px",
    },
  },
  mapLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.palette.surface.overlay,
    color: theme.palette.text.primary,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing(2),
  },
}));

// Fallback center used only for the very first render before any data loads.
const FALLBACK_CENTER: [number, number] = [0, 0];

/**
 * Handles the map of our application and contains all of its controls
 * and watershed specific workflows.
 *
 * @param webcloudRunId - Watershed ID taken from the useParams hook in @see {@link Home} page.
 * @returns {JSX.Element} - A Leaflet map that contains our GIS watershed data.
 */
export default function WatershedMap(): JSX.Element {
  const navigate = useNavigate();
  const savedView = getSavedMapView();

  const runId = useRunId();

  const { classes, cx } = useStyles();

  const { layerDesired, effective, isEffective } = useWatershed();

  useLayerToasts(layerDesired, effective);

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

  const rhessysOutputsEffective = isEffective("rhessysOutputs");
  const rhessysOutputsParams = getLayerParams(layerDesired, "rhessysOutputs");
  const rhessysOutputsScenario = rhessysOutputsParams.scenario;
  const rhessysOutputsVariable = rhessysOutputsParams.variable;

  const choroplethLegendProps = useChoroplethLegend();

  const scenarioEffective = isEffective("scenario");
  const subcatchmentEffective = isEffective("subcatchment");
  const channelsEffective = isEffective("channels");
  const landuseEffective = isEffective("landuse");
  const sbsEffective = isEffective("sbs");
  const sbsColorMode = getLayerParams(layerDesired, "sbs").mode ?? "legacy";

  const rhessysSpatialEffective = isEffective("rhessysSpatial");
  const rhessysSpatialParams = getLayerParams(layerDesired, "rhessysSpatial");
  const rhessysSpatialFilename = rhessysSpatialParams.filename;

  const {
    data: watersheds,
    error: watershedsError,
    isLoading: watershedsLoading,
  } = useQuery({
    queryKey: queryKeys.watersheds.all,
    queryFn: fetchWatersheds,
  });

  const { subcatchments, subLoading } = useSubcatchmentData(runId);
  const { channelData, channelLoading } = useChannelData(runId);
  const { landuseData, landuseLoading } = useLanduseData(runId);

  // Simple key that changes when any coverage styling input changes,
  // forcing SubcatchmentLayer to re-apply styles.
  const { metric, year, bands } = getLayerParams(layerDesired, "choropleth");
  const { scenario, variable } = getLayerParams(layerDesired, "scenario");
  const coverageKey = `${choroplethActive}|${metric}|${year}|${bands}|${scenarioEffective}|${hasScenarioData}|${scenario}|${variable}|${landuseEffective}|${!!landuseData}`;

  /* Navigates to a watershed on click */
  const onWatershedClick = (e: LeafletMouseEvent) => {
    const layer = e.sourceTarget;
    const feature = layer.feature;

    navigate({
      to: `/watershed/${feature.id}`,
    });
  };

  const anyRasterActive =
    sbsEffective || rhessysSpatialEffective || rhessysOutputsEffective;

  const watershedStyle = useCallback(
    (
      feature:
        | GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>
        | undefined,
    ) => {
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
    ) => {
      if (choroplethActive && feature?.properties?.weppid) {
        const choroplethStyle = getChoroplethStyle(feature.properties.weppid);
        if (choroplethStyle) {
          return choroplethStyle;
        }
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

      // Default style
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

  const channelStyle = useCallback(
    () => ({
      color: "#000080",
      fillOpacity: 1,
      weight: 2,
    }),
    [],
  );

  const [selectedLayerId, setSelectedLayerId] = useState<
    "Satellite" | "Topographic"
  >("Satellite");

  const tileLayers: Record<
    "Satellite" | "Topographic",
    {
      url: string;
      attribution: string;
      maxZoom: number;
      subdomains?: string[];
    }
  > = {
    Satellite: {
      // NOTE: unofficial Google tile endpoint. For production consider using the Google Maps APIs with a key.
      url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      attribution: "&copy; Google",
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    },
    Topographic: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      maxZoom: 17,
    },
  };

  // Compute the bounding box of the currently selected watershed so the SBS
  // TileLayer only requests tiles that intersect it.
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

  if (watershedsError) return <div>Error: {watershedsError.message}</div>;

  return (
    <div
      className={cx(
        classes.mapContainer,
        runId && classes.mapContainerWithPanel,
      )}
    >
      <MapContainer
        center={savedView?.center ?? FALLBACK_CENTER}
        zoom={savedView?.zoom ?? 4}
        maxZoom={tileLayers[selectedLayerId].maxZoom}
        zoomControl={false}
        doubleClickZoom={false}
        scrollWheelZoom
        maxBoundsViscosity={0.5}
        style={{ height: "100%", width: "100%" }}
        preferCanvas
      >
        {(watershedsLoading ||
          subLoading ||
          channelLoading ||
          choroplethLoading ||
          landuseLoading ||
          scenarioLoading ||
          rhessysChoroplethLoading) && (
          <div
            className={classes.mapLoadingOverlay}
            data-testid="map-loading-overlay"
          >
            <CircularProgress size={50} color="inherit" />
          </div>
        )}

        <TileLayer
          key={selectedLayerId}
          attribution={tileLayers[selectedLayerId].attribution}
          url={tileLayers[selectedLayerId].url}
          maxZoom={tileLayers[selectedLayerId].maxZoom}
          {...(tileLayers[selectedLayerId].subdomains
            ? { subdomains: tileLayers[selectedLayerId].subdomains }
            : {})}
        />

        <ScaleControl metric={true} imperial={true} />

        {/* TOP RIGHT CONTROLS */}
        <div className="leaflet-top leaflet-right">
          <SearchControl />
          <LayersControl
            selectedLayerId={selectedLayerId}
            setSelectedLayerId={setSelectedLayerId}
          />
          <ZoomInControl />
          <ZoomOutControl />
        </div>

        {watersheds && (
          <MapEffect watershedId={runId} watersheds={watersheds} />
        )}

        {/* Show watersheds when subcatchments are not enabled or not loaded or empty */}
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

        {/* Show subcatchments only when enabled AND data exists with features */}
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
          rhessysOutputsScenario &&
          rhessysOutputsVariable &&
          rhessysOutputsParams.mode !== "choropleth" && (
            <RhessysOutputLayer
              runId={runId}
              scenario={rhessysOutputsScenario}
              variable={rhessysOutputsVariable}
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
      </MapContainer>

      {choroplethLegendProps && <ChoroplethLegend {...choroplethLegendProps} />}
      {sbsEffective && <SbsLegend />}
    </div>
  );
}
