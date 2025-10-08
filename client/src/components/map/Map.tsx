import { useCallback, useContext, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, ScaleControl } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { MapEffect } from '../../utils/map/MapEffectUtil';
import { WatershedIDContext } from '../../context/watershed-id/WatershedIDContext';
import { fetchChannels, fetchSubcatchments, fetchWatersheds } from '../../api/api';
import { useBottomPanelContext } from '../../context/bottom-panel/BottomPanelContext';
import { useWatershedOverlayStore } from '../../store/WatershedOverlayStore';
import { Properties } from '../../types/WatershedFeature';
import { LeafletMouseEvent, PathOptions } from 'leaflet';
import DataLayersControl from './controls/DataLayers/DataLayers';
import ZoomInControl from './controls/ZoomIn/ZoomIn';
import ZoomOutControl from './controls/ZoomOut/ZoomOut';
// import LayersControl from './controls/Layers/Layers';
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

{ /* Styles for selected and non selected watersheds */ }
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

// Renders subcatchment hillslope polygons and binds hover-only tooltips
function SubcatchmentLayer({ data, style }: {
  data: GeoJSON.FeatureCollection
  style: (feature: GeoJSON.Feature<GeoJSON.Geometry, Properties> | undefined) => PathOptions
}) {
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
          ${props.width_m.toFixed(2) ?? 'N/A'} m
          <br/><strong>Length:</strong>
          ${props.length_m.toFixed(2) ?? 'N/A'} m
          <br/><strong>Area:</strong>
          ${props.area_m2 ? (props.area_m2 / 10000).toFixed(2) : 'N/A'} ha
          <br/><strong>Slope:</strong>
          ${props.slope_scalar ? props.slope_scalar.toFixed(2) : 'N/A'}
          <br/><strong>Aspect:</strong>
          ${props.aspect.toFixed(2) ?? 'N/A'}
          <br/><strong>Soil:</strong>
          ${props.soil ?? 'N/A'}</span>`,
          { className: 'tooltip-bold' }
        );
        layer.on({
          mouseover: () => layer.openTooltip(),
          mouseout: () => layer.closeTooltip(),
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

  const watershedId = useContext(WatershedIDContext)
  const { subcatchment, channels, landuse } = useWatershedOverlayStore();
  const { setLanduseLegendMap } = useWatershedOverlayStore();

  const { data: watersheds, error: watershedsError, isLoading: watershedsLoading } = useQuery({
    queryKey: ['watersheds'],
    queryFn: fetchWatersheds,
  });

  const { data: subcatchments, error: subError, isLoading: subLoading } = useQuery({
    queryKey: ['subcatchments', watershedId],
    queryFn: () => fetchSubcatchments(watershedId!),
    enabled: Boolean(subcatchment && watershedId),
  });

  const { data: channelData, error: channelError, isLoading: channelLoading } = useQuery({
    queryKey: ['channels', watershedId],
    queryFn: () => fetchChannels(watershedId!),
    enabled: Boolean(channels && watershedId),
  });

  const bottomPanel = useBottomPanelContext();

  { /* Navigates to a watershed on click */ }
  const onWatershedClick = (e: LeafletMouseEvent) => {
    const layer = e.sourceTarget;
    const feature = layer.feature;

    bottomPanel.closePanel();
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
      feature?.id?.toString() === watershedId ? selectedStyle : defaultStyle,
    [watershedId]
  );

  useMemo(() => {
    if (landuse && memoSubcatchments) {
      const legend: Record<string, string> = {};
      for (const feature of memoSubcatchments.features) {
        const color = feature.properties?.color;
        const desc = feature.properties?.desc;
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
      if (landuse && feature?.properties?.color) {
        return {
          color: '#2c2c2c',
          weight: 0.75,
          fillColor: feature.properties.color,
          fillOpacity: 1,
        };
      }
      return {
        color: '#2c2c2c',
        weight: 0.75,
        fillColor: '#4a83ec',
        fillOpacity: 0.1,
      };
    },
    [landuse]
  );

  const channelStyle = useCallback(
    () => ({
      color: '#ff6700',
      fillOpacity: 0.1,
      weight: 0.75
    }),
    []
  );

  const [selectedLayerId, /*setSelectedLayerId*/] = useState</*'Satellite' | */ 'Topographic'>('Topographic');

  const tileLayers = {
    // Satellite: {
    //   url: "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg",
    //   attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    //   maxZoom: 20,
    // },
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
          attribution={tileLayers[selectedLayerId].attribution}
          url={tileLayers[selectedLayerId].url}
          maxZoom={tileLayers[selectedLayerId].maxZoom}
        />

        <ScaleControl metric={true} imperial={true} />

        {/* TOP LEFT CONTROLS */}
        <div className="leaflet-top leaflet-left">
          <LegendControl />
        </div>

        {/* TOP RIGHT CONTROLS */}
        <div className="leaflet-top leaflet-right">
          <SearchControl />
          {/* <LayersControl
              selectedLayerId={selectedLayerId}
              setSelectedLayerId={setSelectedLayerId}
            /> */}
          <ZoomInControl />
          <ZoomOutControl />
          <SettingsControl />
        </div>

        {/* Handles URL navigation to a specified watershed */}
        <MapEffect watershedId={watershedId} watersheds={memoWatersheds} />

        {memoWatersheds && (
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
          <GeoJSON data={memoChannels} style={channelStyle} />
        )}
      </MapContainer>

      <LandUseLegend />

      {watershedId && (
        <div style={{ position: 'absolute', right: '20px', bottom: '30px' }}>
          <DataLayersControl />
        </div>
      )}
    </div>
  );
}
