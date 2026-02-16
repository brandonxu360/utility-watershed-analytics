import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, ScaleControl } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { useMatch, useNavigate } from "@tanstack/react-router";
import { MapEffect } from "../../utils/map/MapEffectUtil";

import {
  fetchChannels,
  fetchSubcatchments,
  fetchWatersheds,
} from "../../api/api";

import { SubcatchmentProperties } from "../../types/SubcatchmentProperties";
import { WatershedProperties } from "../../types/WatershedProperties";
import { LeafletMouseEvent } from "leaflet";
import { watershedOverviewRoute } from "../../routes/router";
import { useChoropleth } from "../../hooks/useChoropleth";
import { selectedStyle, defaultStyle } from "./constants";
import { useAppStore } from "../../store/store";
import { toast } from "react-toastify";
import { tss } from "../../utils/tss";
import { CircularProgress } from "@mui/material";
import DataLayersControl from "./controls/DataLayers/DataLayers";
import ZoomInControl from "./controls/ZoomIn";
import ZoomOutControl from "./controls/ZoomOut";
import LayersControl from "./controls/Layers";
import LegendControl from "./controls/Legend";
import SearchControl from "./controls/Search";
import SettingsControl from "./controls/Settings";
import LandUseLegend from "./controls/LandUseLegend";
import SubcatchmentLayer from "./SubcatchmentLayer";
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
 * @param webcloudRunId - Watershed ID taken from the useMatch hook in @see {@link Home} page.
 * @returns {JSX.Element} - A Leaflet map that contains our GIS watershed data.
 */
export default function Map(): JSX.Element {
  const { classes } = useStyles();
  const navigate = useNavigate();

  const {
    subcatchment,
    channels,
    landuse,
    closePanel,
    setSubcatchment,
    setChannels,
    setLanduse,
    setLanduseLegendMap,
  } = useAppStore();

  // Use the choropleth hook for data fetching and styling
  const {
    choropleth,
    isActive: choroplethActive,
    isLoading: choroplethLoading,
    getChoroplethStyle,
  } = useChoropleth();

  const {
    choropleth: { year: choroplethYear, bands: choroplethBands },
  } = useAppStore();

  // Create a key that changes when choropleth state changes to force style updates
  const choroplethKey = useMemo(
    () =>
      `${choropleth}-${choroplethYear ?? "all"}-${choroplethBands}-${choroplethActive}`,
    [choropleth, choroplethYear, choroplethBands, choroplethActive],
  );

  const match = useMatch({
    from: watershedOverviewRoute.id,
    shouldThrow: false,
  });
  const watershedID = match?.params.webcloudRunId ?? null;

  const {
    data: watersheds,
    error: watershedsError,
    isLoading: watershedsLoading,
  } = useQuery({
    queryKey: ["watersheds"],
    queryFn: fetchWatersheds,
  });

  const { data: subcatchments, isLoading: subLoading } = useQuery({
    queryKey: ["subcatchments", watershedID],
    queryFn: () => fetchSubcatchments(watershedID!),
    enabled: Boolean(subcatchment && watershedID),
  });

  const { data: channelData, isLoading: channelLoading } = useQuery({
    queryKey: ["channels", watershedID],
    queryFn: () => fetchChannels(watershedID!),
    enabled: Boolean(channels && watershedID),
  });

  // Auto-disable features that depend on subcatchment data
  useEffect(() => {
    if (!watershedID || subLoading || !subcatchments) return;

    const noData = subcatchments.features?.length === 0;
    const featuresEnabled = subcatchment || landuse;

    if (noData && featuresEnabled) {
      if (subcatchment) setSubcatchment(false);
      if (landuse) setLanduse(false);
      toast.error("No subcatchment data available");
    }
  }, [
    watershedID,
    subcatchments,
    subLoading,
    subcatchments?.features?.length,
    subcatchment,
    landuse,
    setSubcatchment,
    setLanduse,
  ]);

  // Auto-disable channels if data unavailable
  useEffect(() => {
    if (!watershedID || channelLoading || !channelData) return;

    if (channelData.features?.length === 0 && channels) {
      setChannels(false);
      toast.error("No channel data available");
    }
  }, [
    watershedID,
    channelData,
    channelLoading,
    channelData?.features?.length,
    channels,
    setChannels,
  ]);

  /* Navigates to a watershed on click */
  const onWatershedClick = (e: LeafletMouseEvent) => {
    const layer = e.sourceTarget;
    const feature = layer.feature;

    closePanel(); // TODO: The panel should only close if watershed id changes
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
    ) =>
      feature?.id?.toString() === watershedID ? selectedStyle : defaultStyle,
    [watershedID],
  );

  useEffect(() => {
    if (landuse && memoSubcatchments) {
      const legend: Record<string, string> = {};
      for (const feature of memoSubcatchments.features) {
        const color = feature.properties?.landuse_color;
        const desc = feature.properties?.landuse_desc;
        if (color && desc && !(color in legend)) {
          legend[color] = desc;
        }
      }
      setLanduseLegendMap(legend);
    } else if (!landuse) {
      setLanduseLegendMap({});
    }
  }, [landuse, memoSubcatchments, setLanduseLegendMap]);

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

      // Land use coloring
      if (landuse && feature?.properties?.landuse_color) {
        return {
          color: "#2c2c2c",
          weight: 0.75,
          fillColor: feature.properties.landuse_color,
          fillOpacity: 1,
        };
      }

      // Default style
      return {
        color: "rgb(255, 255, 0, 0.5)",
        weight: 1,
        fillOpacity: 0,
      };
    },
    [landuse, choroplethActive, getChoroplethStyle],
  );

  const channelStyle = useCallback(
    () => ({
      color: "#ff6700",
      fillOpacity: 0.75,
      weight: 0.75,
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
          choroplethLoading) && (
          <div
            className={classes.mapLoadingOverlay}
            data-testid="map-loading-overlay"
          >
            <CircularProgress size={50} />
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
          <SettingsControl />
        </div>

        {/* Handles URL navigation to a specified watershed */}
        <MapEffect watershedId={watershedID} watersheds={memoWatersheds} />

        {/* Show watersheds when subcatchments are not enabled or not loaded or empty */}
        {(!subcatchment || !memoSubcatchments?.features?.length) &&
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
        {subcatchment && memoSubcatchments?.features?.length && (
          <SubcatchmentLayer
            data={memoSubcatchments}
            style={subcatchmentStyle}
            choroplethActive={choroplethActive}
            choroplethKey={choroplethKey}
          />
        )}

        {channels && memoChannels && (
          <GeoJSON data={memoChannels} style={channelStyle} />
        )}
      </MapContainer>

      <LandUseLegend />

      {watershedID && (
        <div style={{ position: "absolute", right: "10px", bottom: "30px" }}>
          <DataLayersControl />
        </div>
      )}
    </div>
  );
}
