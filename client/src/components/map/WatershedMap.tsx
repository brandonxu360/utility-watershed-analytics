import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, ScaleControl } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { MapEffect } from "../../utils/map/MapEffectUtil";

import {
  fetchChannels,
  fetchSubcatchments,
  fetchWatersheds,
} from "../../api/api";

import { SubcatchmentProperties } from "../../types/SubcatchmentProperties";
import { WatershedProperties } from "../../types/WatershedProperties";
import { LeafletMouseEvent } from "leaflet";
import { useChoropleth } from "../../hooks/useChoropleth";
import { selectedStyle, defaultStyle } from "./constants";
import { tss } from "../../utils/tss";
import { CircularProgress } from "@mui/material";
import { fetchLanduse } from "../../api/landuseApi";
import { useWatershed } from "../../contexts/WatershedContext";
import DataLayersControl from "./controls/DataLayers/DataLayers";
import ZoomInControl from "./controls/ZoomIn";
import ZoomOutControl from "./controls/ZoomOut";
import LayersControl from "./controls/Layers";
import LegendControl from "./controls/Legend";
import SearchControl from "./controls/Search";
import LandUseLegend from "./controls/LandUseLegend";
import SbsLegend from "./controls/SbsLegend";
import SbsLayer from "./SbsLayer";
import SubcatchmentLayer from "./SubcatchmentLayer";
import { useLayerToasts } from "../../hooks/useLayerToasts";
import "leaflet/dist/leaflet.css";

const useStyles = tss.create(({ theme }) => ({
  mapContainer: {
    height: "100%",
    width: "100%",
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

// Center coordinates [lat, lng]
const CENTER: [number, number] = [
  Number(((43.75 + 49.19) / 2).toFixed(2)),
  Number(((-124.52 + -113.93) / 2).toFixed(2)),
];

// Bounds
// Extent: (-124.517612, 41.880540) - (-116.934213, 46.188423)
const BOUNDS: [[number, number], [number, number]] = [
  [41.88 - 5, -124.52 - 5], // Southwest corner [lat, lng]
  [46.19 + 5, -116.93 + 5], // Northeast corner [lat, lng]
];

/**
 * Handles the map of our application and contains all of its controls
 * and watershed specific workflows.
 *
 * @param webcloudRunId - Watershed ID taken from the useParams hook in @see {@link Home} page.
 * @returns {JSX.Element} - A Leaflet map that contains our GIS watershed data.
 */
export default function WatershedMap(): JSX.Element {
  const { classes } = useStyles();
  const navigate = useNavigate();

  const {
    layerDesired,
    setLanduseLegendMap,
    setDataAvailability,
    setLayerLoading,
    effective,
    isEffective,
  } = useWatershed();

  // Fire toasts when layers are blocked
  useLayerToasts(layerDesired, effective);

  // Use the choropleth hook for data fetching and styling
  const {
    isActive: choroplethActive,
    isLoading: choroplethLoading,
    getChoroplethStyle,
  } = useChoropleth();

  // Shorthand booleans from effective state for rendering
  const subcatchmentEffective = isEffective("subcatchment");
  const channelsEffective = isEffective("channels");
  const landuseEffective = isEffective("landuse");
  const sbsEffective = isEffective("sbs");
  const sbsColorMode = (layerDesired.sbs.params.mode as string) ?? "legacy";

  // Create a key that changes when choropleth state changes to force style updates
  const choroplethYear = layerDesired.choropleth.params.year as number | null;
  const choroplethBands = layerDesired.choropleth.params.bands as string;
  const choroplethKey = useMemo(
    () =>
      `${layerDesired.choropleth.params.metric}-${choroplethYear ?? "all"}-${choroplethBands}-${choroplethActive}`,
    [
      layerDesired.choropleth.params.metric,
      choroplethYear,
      choroplethBands,
      choroplethActive,
    ],
  );

  const runId =
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null;

  const {
    data: watersheds,
    error: watershedsError,
    isLoading: watershedsLoading,
  } = useQuery({
    queryKey: ["watersheds"],
    queryFn: fetchWatersheds,
  });

  const {
    data: subcatchments,
    isLoading: subLoading,
    isError: subError,
  } = useQuery({
    queryKey: ["subcatchments", runId],
    queryFn: () => fetchSubcatchments(runId!),
    enabled: Boolean(layerDesired.subcatchment.enabled && runId),
  });

  const {
    data: channelData,
    isLoading: channelLoading,
    isError: channelError,
  } = useQuery({
    queryKey: ["channels", runId],
    queryFn: () => fetchChannels(runId!),
    enabled: Boolean(layerDesired.channels.enabled && runId),
  });

  const {
    data: landuseData,
    isLoading: landuseLoading,
    error: landuseError,
  } = useQuery({
    queryKey: ["landuse-undisturbed", runId],
    queryFn: () => fetchLanduse({ runId: runId! }),
    enabled: Boolean(layerDesired.landuse.enabled && runId),
  });

  // Update runtime data availability for subcatchment
  useEffect(() => {
    if (!runId || !layerDesired.subcatchment.enabled) return;

    // Clear stale availability while a fresh fetch is in progress
    if (subLoading) {
      setDataAvailability("subcatchment", undefined);
      return;
    }

    const hasData = !subError && (subcatchments?.features?.length ?? 0) > 0;
    setDataAvailability("subcatchment", hasData);
  }, [
    layerDesired.subcatchment.enabled,
    subLoading,
    subError,
    subcatchments,
    runId,
    setDataAvailability,
  ]);

  // Update runtime data availability for landuse
  useEffect(() => {
    if (!runId || !layerDesired.landuse.enabled) return;

    // Clear stale availability while a fresh fetch is in progress
    if (landuseLoading) {
      setDataAvailability("landuse", undefined);
      return;
    }

    const hasData =
      !landuseError &&
      landuseData != null &&
      Object.keys(landuseData).length > 0;
    setDataAvailability("landuse", hasData);
  }, [
    layerDesired.landuse.enabled,
    landuseData,
    landuseLoading,
    landuseError,
    runId,
    setDataAvailability,
  ]);

  // Update runtime data availability for channels
  useEffect(() => {
    if (!runId || !layerDesired.channels.enabled) return;

    // Clear stale availability while a fresh fetch is in progress
    if (channelLoading) {
      setDataAvailability("channels", undefined);
      return;
    }

    const hasData = !channelError && (channelData?.features?.length ?? 0) > 0;
    setDataAvailability("channels", hasData);
  }, [
    layerDesired.channels.enabled,
    runId,
    channelData,
    channelLoading,
    channelError,
    setDataAvailability,
  ]);

  // Update loading flags
  useEffect(() => {
    setLayerLoading("subcatchment", subLoading);
  }, [subLoading, setLayerLoading]);

  useEffect(() => {
    setLayerLoading("channels", channelLoading);
  }, [channelLoading, setLayerLoading]);

  useEffect(() => {
    setLayerLoading("landuse", landuseLoading);
  }, [landuseLoading, setLayerLoading]);

  /* Navigates to a watershed on click */
  const onWatershedClick = (e: LeafletMouseEvent) => {
    const layer = e.sourceTarget;
    const feature = layer.feature;
    console.log(feature);

    // Navigation triggers runId change → WatershedProvider dispatches RESET
    navigate({
      to: `/watershed/${feature.id}`,
    });
  };

  // Memoize GeoJSON data to prevent unnecessary re-renders
  const memoWatersheds = useMemo(() => watersheds, [watersheds]);
  const memoSubcatchments = useMemo(() => subcatchments, [subcatchments]);
  const memoChannels = useMemo(() => channelData, [channelData]);

  // Memoize style functions
  const watershedStyle = useCallback(
    (
      feature:
        | GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>
        | undefined,
    ) => (feature?.id?.toString() === runId ? selectedStyle : defaultStyle),
    [runId],
  );

  // Build landuse legend directly from landuse data
  useEffect(() => {
    if (
      landuseEffective &&
      landuseData &&
      Object.keys(landuseData).length > 0
    ) {
      const legend: Record<string, string> = {};
      for (const { color, desc } of Object.values(landuseData)) {
        if (color && desc && !(color in legend)) {
          legend[color] = desc;
        }
      }
      setLanduseLegendMap(legend);
    } else if (!landuseEffective || !runId) {
      setLanduseLegendMap({});
    }
  }, [
    landuseEffective,
    landuseData,
    runId,
    setLanduseLegendMap,
  ]);

  const subcatchmentStyle = useCallback(
    (
      feature:
        | GeoJSON.Feature<GeoJSON.Geometry, SubcatchmentProperties>
        | undefined,
    ) => {
      // Choropleth coloring takes precedence (uses weppid since RAP data is aggregated by wepp_id)
      if (choroplethActive && feature?.properties?.weppid) {
        const choroplethStyle = getChoroplethStyle(feature.properties.weppid);
        if (choroplethStyle) {
          return choroplethStyle;
        }
      }

      // Land use coloring - lookup by topazid
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
    [landuseEffective, landuseData, choroplethActive, getChoroplethStyle],
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
    if (!runId || !memoWatersheds) return undefined;
    const feature = memoWatersheds.features?.find(
      (f: GeoJSON.Feature) => f.id?.toString() === runId,
    );
    if (!feature) return undefined;
    try {
      return L.geoJSON(feature).getBounds();
    } catch {
      return undefined;
    }
  }, [runId, memoWatersheds]);

  // Only crash on critical data failure (watersheds are required for the map to function)
  if (watershedsError) return <div>Error: {watershedsError.message}</div>;

  return (
    <div className={classes.mapContainer}>
      <MapContainer
        center={CENTER}
        zoom={7}
        minZoom={7}
        maxZoom={tileLayers[selectedLayerId].maxZoom}
        zoomControl={false}
        doubleClickZoom={false}
        scrollWheelZoom
        maxBounds={BOUNDS}
        maxBoundsViscosity={0.5}
        bounds={BOUNDS}
        style={{ height: "100%", width: "100%" }}
        preferCanvas
      >
        {(watershedsLoading ||
          subLoading ||
          channelLoading ||
          choroplethLoading ||
          landuseLoading) && (
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

        {/* TOP LEFT CONTROLS */}
        <div className="leaflet-top leaflet-left">
          <LegendControl />
        </div>

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

        {/* Handles URL navigation to a specified watershed */}
        <MapEffect watershedId={runId} watersheds={memoWatersheds} />

        {/* Show watersheds when subcatchments are not enabled or not loaded or empty */}
        {(!subcatchmentEffective || !memoSubcatchments?.features?.length) &&
          memoWatersheds && (
            <GeoJSON
              data={memoWatersheds}
              style={watershedStyle}
              onEachFeature={(_, layer) =>
                layer.on({ click: onWatershedClick })
              }
            />
          )}

        {/* Show subcatchments only when enabled AND data exists with features */}
        {subcatchmentEffective && memoSubcatchments?.features?.length && (
          <SubcatchmentLayer
            data={memoSubcatchments}
            style={subcatchmentStyle}
            choroplethActive={choroplethActive}
            choroplethKey={choroplethKey}
          />
        )}

        {channelsEffective && memoChannels && (
          <GeoJSON data={memoChannels} style={channelStyle} />
        )}

        {sbsEffective && runId && (
          <SbsLayer
            runId={runId}
            mode={sbsColorMode}
            bounds={sbsBounds}
          />
        )}
      </MapContainer>

      <LandUseLegend />

      {sbsEffective && <SbsLegend />}

      {runId && (
        <div style={{ position: "absolute", right: "10px", bottom: "30px" }}>
          <DataLayersControl />
        </div>
      )}
    </div>
  );
}
