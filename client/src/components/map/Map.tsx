import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, ScaleControl, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { MapEffect } from '../../utils/map/MapEffectUtil';
import { fetchChannels, fetchSubcatchments, fetchWatersheds } from '../../api/api';
import { useWatershedOverlayStore } from '../../store/WatershedOverlayStore';
import { Properties } from '../../types/WatershedFeature';
import { LeafletEvent, LeafletMouseEvent, PathOptions } from 'leaflet';
import { useBottomPanelStore } from '../../store/BottomPanelStore';
import { watershedOverviewRoute } from '../../routes/router';
import { zoomToFeature } from '../../utils/map/MapUtil';
import DataLayersControl from './controls/DataLayers/DataLayers';
import ZoomInControl from './controls/ZoomIn/ZoomIn';
import ZoomOutControl from './controls/ZoomOut/ZoomOut';
import LayersControl from './controls/Layers/Layers';
import LegendControl from './controls/Legend/Legend';
import SearchControl from './controls/Search/Search';
import SettingsControl from './controls/Settings/Settings';
import LandUseLegend from './controls/LandUseLegend/LandUseLegend';
import 'leaflet/dist/leaflet.css';
import './Map.css';

// Center coordinates [lat, lng]
const CENTER: [number, number] = [
  Number(((43.88 + 49.19) / 2).toFixed(2)),
  Number(((-124.52 + -116.93) / 2).toFixed(2))
];

// Bounds
// Extent: (-124.517612, 41.880540) - (-116.934213, 46.188423)
const BOUNDS: [[number, number], [number, number]] = [
  [41.88 - 5, -124.52 - 5], // Southwest corner [lat, lng]
  [46.19 + 5, -116.93 + 5]  // Northeast corner [lat, lng]
];

/* Feature Styles */
const defaultStyle = {
  color: '#4a83ec',
  weight: 3,
  fillColor: '#4a83ec',
  fillOpacity: 0.25,
};

const selectedStyle = {
  color: '#2c2c2c',
  weight: 3,
  fillColor: '#4a83ec',
  fillOpacity: 0.5,
};

const highlightedStyle = {
  color: '#f5f5f5',
  weight: 2,
  fillColor: '#a0b7e2ff',
  fillOpacity: 0.5,
};

// Renders subcatchment hillslope polygons and binds hover-only tooltips
function SubcatchmentLayer({ data, style }: {
  data: GeoJSON.FeatureCollection
  style: (feature: GeoJSON.Feature<GeoJSON.Geometry, Properties> | undefined) => PathOptions
}) {
  const map = useMap();

  const { setSelectedHillslope, clearSelectedHillslope } = useBottomPanelStore();

  // Track selected feature id and layer using refs so event handlers
  // can read/update the current selection at event time without forcing rerenders.
  const selectedIdRef = useRef<string | null>(null);
  const selectedLayerRef = useRef<{
    layer: LeafletEvent['target'];
    feature: GeoJSON.Feature<GeoJSON.Geometry, Properties> | null;
  } | null>(null);

  const setSelection = (
    id: string | null,
    layer?: LeafletEvent['target'],
    feature?: GeoJSON.Feature<GeoJSON.Geometry, Properties> | null
  ) => {
    selectedIdRef.current = id;
    if (id && layer) {
      selectedLayerRef.current = { layer, feature: feature ?? null };
    } else {
      selectedLayerRef.current = null;
    }
  };

  return (
    <GeoJSON
      data={data}
      style={style}
      onEachFeature={(feature, layer) => {
        const props = feature.properties ?? {};
        layer.bindTooltip(
          `<span class="tooltip-bold"><strong>Hillslope ID</strong>
          <br/>TopazID: ${props.topazid ?? 'N/A'}, WeppID: ${props.weppid ?? 'N/A'}
          <br/><strong>Width:</strong>
          ${props.width?.toFixed(2) ?? 'N/A'} m
          <br/><strong>Length:</strong>
          ${props.length?.toFixed(2) ?? 'N/A'} m
          <br/><strong>Area:</strong>
          ${props.hillslope_area ? (props.hillslope_area / 10000).toFixed(2) : 'N/A'} ha
          <br/><strong>Slope:</strong>
          ${props.slope_scalar?.toFixed(2) ?? 'N/A'}
          <br/><strong>Aspect:</strong>
          ${props.aspect?.toFixed(2) ?? 'N/A'}
          <br/><strong>Soil:</strong>
          ${props.simple_texture ?? 'N/A'}</span>`,
          {
            className: 'tooltip',
            offset: [12, -50],
          }
        );
        layer.on({
          click: (e) => {
            const fid = feature?.id?.toString?.() ?? null;

            if (selectedIdRef.current === fid) {
              e.target.setStyle(style(feature));
              setSelection(null);
              clearSelectedHillslope();
            } else {
              if (selectedLayerRef.current) {
                selectedLayerRef.current.layer.setStyle(
                  style(selectedLayerRef.current.feature ?? undefined)
                );
              }

              // Set new selection
              e.target.setStyle(selectedStyle);
              setSelection(fid, e.target, feature);
              setSelectedHillslope(feature.properties.weppid, feature.properties);
            }

            zoomToFeature(map, layer);
          }
        });
        layer.on({
          mouseover: (e) => {
            const fid = feature?.id?.toString?.() ?? null;

            if (selectedIdRef.current === fid) {
              e.target.setStyle(selectedStyle);
            } else {
              e.target.setStyle(highlightedStyle);
            }

            layer.openTooltip();
          },
        });
        layer.on({
          mouseout: (e) => {
            const fid = feature?.id?.toString?.() ?? null;

            if (selectedIdRef.current === fid) {
              layer.closeTooltip();
            } else {
              e.target.setStyle(style(feature));
              layer.closeTooltip();
            }
          },
        });
      }}
    />
  )
}

/**
 * Handles the map of our application and contains all of its controls
 * and watershed specific workflows.
 *
 * @param webcloudRunId - Watershed ID taken from the useMatch hook in @see {@link Home} page.
 * @returns {JSX.Element} - A Leaflet map that contains our GIS watershed data.
 */
export default function Map(): JSX.Element {
  const navigate = useNavigate()

  const { subcatchment, channels, landuse } = useWatershedOverlayStore();
  const { setLanduseLegendMap } = useWatershedOverlayStore();

  const match = useMatch({ from: watershedOverviewRoute.id, shouldThrow: false });
  const watershedID = match?.params.webcloudRunId ?? null;

  const { data: watersheds, error: watershedsError, isLoading: watershedsLoading } = useQuery({
    queryKey: ['watersheds'],
    queryFn: fetchWatersheds,
  });

  const { data: subcatchments, error: subError, isLoading: subLoading } = useQuery({
    queryKey: ['subcatchments', watershedID],
    queryFn: () => fetchSubcatchments(watershedID!),
    enabled: Boolean(subcatchment && watershedID),
  });

  const { data: channelData, error: channelError, isLoading: channelLoading } = useQuery({
    queryKey: ['channels', watershedID],
    queryFn: () => fetchChannels(watershedID!),
    enabled: Boolean(channels && watershedID),
  });

  const { closePanel } = useBottomPanelStore();

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
    (feature: GeoJSON.Feature<GeoJSON.Geometry, Properties> | undefined) =>
      feature?.id?.toString() === watershedID ? selectedStyle : defaultStyle,
    [watershedID]
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
    (feature: GeoJSON.Feature<GeoJSON.Geometry, Properties> | undefined) => {
      if (landuse && feature?.properties?.landuse_color) {
        return {
          color: '#2c2c2c',
          weight: 0.75,
          fillColor: feature.properties.landuse_color,
          fillOpacity: 1,
        };
      }
      return {
        color: '#2c2c2c',
        weight: 0.75,
        fillColor: '#4a83ec',
        fillOpacity: 0.75,
      };
    },
    [landuse]
  );

  const channelStyle = useCallback(
    () => ({
      color: '#ff6700',
      fillOpacity: 0.75,
      weight: 0.75
    }),
    []
  );

  const [selectedLayerId, setSelectedLayerId] = useState<'Satellite' | 'Topographic'>('Satellite');

  const tileLayers: Record<'Satellite' | 'Topographic', {
    url: string;
    attribution: string;
    maxZoom: number;
    subdomains?: string[];
  }> = {
    Satellite: {
      // NOTE: unofficial Google tile endpoint. For production consider using the Google Maps APIs with a key.
      url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      attribution: '&copy; Google',
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    },
    Topographic: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      maxZoom: 17,
    }
  };

  if (watershedsError) return <div>Error: {watershedsError.message}</div>;
  if (subError) return <div>Error: {subError.message}</div>;
  if (channelError) return <div>Error: {channelError.message}</div>;

  return (
    <div className="map-container">
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
        style={{ height: '100%', width: '100%' }}
        preferCanvas
      >

        {(watershedsLoading || subLoading || channelLoading) && (
          <div className="map-loading-overlay">
            <div className="loading-spinner" />
          </div>
        )}

        <TileLayer
          key={selectedLayerId}
          attribution={tileLayers[selectedLayerId].attribution}
          url={tileLayers[selectedLayerId].url}
          maxZoom={tileLayers[selectedLayerId].maxZoom}
          {...(tileLayers[selectedLayerId].subdomains ? { subdomains: tileLayers[selectedLayerId].subdomains } : {})}
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

        {!subcatchment && memoWatersheds && (
          <GeoJSON
            data={memoWatersheds}
            style={watershedStyle}
            onEachFeature={(_, layer) => layer.on({ click: onWatershedClick })}
          />
        )}

        {subcatchment && memoSubcatchments && (
          <SubcatchmentLayer
            data={memoSubcatchments}
            style={subcatchmentStyle}
          />
        )}

        {channels && memoChannels && (
          <GeoJSON
            data={memoChannels}
            style={channelStyle}
          />
        )}
      </MapContainer>

      <LandUseLegend />

      {watershedID && (
        <div style={{ position: 'absolute', right: '10px', bottom: '30px' }}>
          <DataLayersControl />
        </div>
      )}
    </div>
  );
}
