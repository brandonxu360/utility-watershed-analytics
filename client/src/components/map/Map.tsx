import { useCallback, useContext, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, ScaleControl } from 'react-leaflet'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { MapEffect } from '../../utils/map/MapEffectUtil'
import { WatershedIDContext } from '../../utils/watershedID/WatershedIDContext'
import { fetchChannels, fetchSubcatchments, fetchWatersheds } from '../../api/api'
import WatershedToggle from './controls/WatershedToggle/WatershedToggle'
import ZoomInControl from './controls/ZoomIn/ZoomIn'
import ZoomOutControl from './controls/ZoomOut/ZoomOut'
import LayersControl from './controls/Layers/Layers'
import LegendControl from './controls/Legend/Legend'
import SearchControl from './controls/Search/Search'
import SettingsControl from './controls/Settings/Settings'
import UserLocationControl from './controls/UserLocation/UserLocation'
import 'leaflet/dist/leaflet.css'
import './Map.css'

// Center coordinates [lat, lng]
const CENTER: [number, number] = [
  Number(((41.88 + 46.19) / 2).toFixed(2)),
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
  fillOpacity: 0.1,
};

const selectedStyle = {
  color: '#444444',
  weight: 3,
  fillColor: '#4a83ec',
  fillOpacity: 0.1,
};

// Renders subcatchment polygons and binds hover-only tooltips
function SubcatchmentLayer({ data, style }: {
  data: GeoJSON.FeatureCollection
  style: (feature: any) => any
}) {
  return (
    <GeoJSON
      data={data}
      style={style}
      onEachFeature={(feature, layer) => {
        // TODO: this area needs to be hectares. Also need to add more of the available data to show with the tooltip.
        const area = feature.properties?.area_m2 ?? 0
        layer.bindTooltip(
          `<strong>Hillslope ${feature.id}</strong><br/>Area: ${area.toFixed(0)} m²`,
        )
        layer.on({
          mouseover: () => layer.openTooltip(),
          mouseout: () => layer.closeTooltip(),
        })
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

  const [showSubcatchments, setShowSubcatchments] = useState(false);
  const [showChannels, setShowChannels] = useState(false);

  const { data: watersheds, error: watershedsError, isLoading: watershedsLoading } = useQuery({
    queryKey: ['watersheds'],
    queryFn: fetchWatersheds,
  });

  const { data: subcatchments, error: subError, isLoading: subLoading } = useQuery({
    queryKey: ['subcatchments', watershedId],
    queryFn: () => fetchSubcatchments(watershedId!),
    enabled: Boolean(showSubcatchments && watershedId),
  });

  const { data: channels, error: channelError, isLoading: channelLoading } = useQuery({
    queryKey: ['channels', watershedId],
    queryFn: () => fetchChannels(watershedId!),
    enabled: Boolean(showChannels && watershedId),
  });

  { /* Navigates to a watershed on click */ }
  const onWatershedClick = (e: any) => {
    const layer = e.sourceTarget;
    const feature = layer.feature;

    navigate({
      to: `/watershed/${feature.id}`,
    });
  };

  // Memoize GeoJSON data to prevent unnecessary re-renders
  const memoWatersheds = useMemo(() => watersheds, [watersheds]);
  const memoSubcatchments = useMemo(() => subcatchments, [subcatchments]);
  const memoChannels = useMemo(() => channels, [channels]);

  // Memoize style functions
  const watershedStyle = useCallback(
    (feature: any) =>
      feature.id?.toString() === watershedId ? selectedStyle : defaultStyle,
    [watershedId]
  );

  const subcatchmentStyle = useCallback(
    () => ({ color: '#007BFF', weight: 1, fillOpacity: 0.1 }),
    []
  );

  const channelStyle = useCallback(
    () => ({ color: '#ff6700', weight: 1, fillOpacity: 0.1 }),
    []
  );

  if (watershedsError) return <div>Error: {watershedsError.message}</div>;
  if (subError) return <div>Error: {subError.message}</div>;
  if (channelError) return <div>Error: {channelError.message}</div>;

  return (
    <div className="map-container">
      <MapContainer
        center={CENTER}
        zoom={6}
        minZoom={6}
        maxZoom={15}
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ScaleControl metric imperial />

        {/* TOP LEFT CONTROLS */}
        <div className="leaflet-top leaflet-left">
          <LegendControl />
          {watershedId && (
            <WatershedToggle
              setShowSubcatchments={setShowSubcatchments}
              setShowChannels={setShowChannels}
            />
          )}
        </div>

        {/* TOP RIGHT CONTROLS */}
        <div className="leaflet-top leaflet-right">
          <SearchControl />
          <LayersControl />
          <ZoomInControl />
          <ZoomOutControl />
          <SettingsControl />
        </div>

        {/* BOTTOM RIGHT CONTROLS */}
        <div className="leaflet-bottom leaflet-right">
          <UserLocationControl />
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

        {showSubcatchments && memoSubcatchments && (
          <SubcatchmentLayer
            data={memoSubcatchments}
            style={subcatchmentStyle}
          />
        )}

        {showChannels && memoChannels && (
          <GeoJSON data={memoChannels} style={channelStyle} />
        )}
      </MapContainer>
    </div>
  );
}
