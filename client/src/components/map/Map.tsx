import { MapContainer, TileLayer, GeoJSON, ScaleControl } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import ZoomInControl from './controls/ZoomIn/ZoomIn';
import ZoomOutControl from './controls/ZoomOut/ZoomOut';
import LayersControl from './controls/Layers/Layers';
import LegendControl from './controls/Legend/Legend';
import SearchControl from './controls/Search/Search';
import SettingsControl from './controls/Settings/Settings';
import UserLocationControl from './controls/UserLocation/UserLocation';
import { useNavigate } from '@tanstack/react-router';
import { MapEffect } from '../../utils/MapEffectUtil';
import { fetchChannels, fetchSubcatchments, fetchWatersheds } from '../../api/api';
import { useCallback, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import WatershedToggle from './controls/WatershedToggle/WatershedToggle';

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

/**
 * Interface for the @see {@link Map} function to enforce type safety.
 */
interface MapProps {
  webcloudRunId: string;
}

/**
 * Handles the map of our application and contains all of its controls
 * and watershed specific workflows.
 *
 * @param webcloudRunId - Watershed ID taken from the useMatch hook in @see {@link Home} page.
 * @returns {JSX.Element} - A Leaflet map that contains our GIS watershed data.
 */
export default function Map({ webcloudRunId }: MapProps): JSX.Element {
  const [showSubcatchments, setShowSubcatchments] = useState(false);
  const [showChannels, setShowChannels] = useState(false);

  const { data: watersheds, error: watershedsError, isLoading: watershedsLoading } = useQuery({
    queryKey: ['watersheds'],
    queryFn: fetchWatersheds,
  });

  const { data: subcatchments, error: subError, isLoading: subLoading } = useQuery({
    queryKey: ['subcatchments', webcloudRunId],
    queryFn: () => fetchSubcatchments(webcloudRunId!),
    enabled: Boolean(showSubcatchments && webcloudRunId),
  });

  const { data: channels, error: channelError, isLoading: channelLoading } = useQuery({
    queryKey: ['channels', webcloudRunId],
    queryFn: () => fetchChannels(webcloudRunId!),
    enabled: Boolean(showChannels && webcloudRunId),
  });

  {/* Navigates to a watershed on click */ }
  const navigate = useNavigate();

  const onWatershedClick = (e: any) => {
    const layer = e.sourceTarget;
    const feature = layer.feature;

    navigate({
      to: `/watershed/${feature.id}`,
    });
  };

  if (watershedsError) return <div>Error: {watershedsError.message}</div>;
  if (subError) return <div>Error: {subError.message}</div>;
  if (channelError) return <div>Error: {channelError.message}</div>;

  // Memoize GeoJSON data to prevent unnecessary re-renders
  const memoWatersheds = useMemo(() => watersheds, [watersheds]);
  const memoSubcatchments = useMemo(() => subcatchments, [subcatchments]);
  const memoChannels = useMemo(() => channels, [channels]);

  // Memoize style functions
  const watershedStyle = useCallback(
    (feature: any) =>
      feature.id?.toString() === webcloudRunId ? selectedStyle : defaultStyle,
    [webcloudRunId]
  );

  const subcatchmentStyle = useCallback(
    () => ({ color: '#007BFF', weight: 1, fillOpacity: 0.1 }),
    []
  );

  const channelStyle = useCallback(
    () => ({ color: '#ff6700', weight: 1, fillOpacity: 0.1 }),
    []
  );

  return (
    <div className="map-container">
      <MapContainer
        center={CENTER}
        zoom={6}
        minZoom={6}
        maxZoom={15}
        zoomControl={false}
        doubleClickZoom={false}
        scrollWheelZoom={true}
        maxBounds={BOUNDS}
        maxBoundsViscosity={0.5}
        bounds={BOUNDS}
        style={{ height: '100%', width: '100%' }}
      >
        <>
          {(watershedsLoading || subLoading || channelLoading) && (
            <div className="map-loading-overlay">
              <div className="loading-spinner" />
            </div>
          )}

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ScaleControl metric={true} imperial={true} />

          {/* TOP LEFT CONTROLS */}
          <div className="leaflet-top leaflet-left">
            <LegendControl />
            {webcloudRunId && (
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
          <MapEffect webcloudRunId={webcloudRunId} watersheds={watersheds} />

          {memoWatersheds && (
            <GeoJSON
              data={memoWatersheds}
              style={watershedStyle}
              onEachFeature={(feature, layer) => layer.on({ click: onWatershedClick })}
            />
          )}

          {showSubcatchments && memoSubcatchments && (
            <GeoJSON data={memoSubcatchments} style={subcatchmentStyle} />
          )}

          {showChannels && memoChannels && (
            <GeoJSON data={memoChannels} style={channelStyle} />
          )}
        </>
      </MapContainer>
    </div>
  );
}
