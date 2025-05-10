import { useRef } from 'react';
import { MapContainer, TileLayer, ScaleControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
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
import { API_ENDPOINTS } from '../../config/api';

import StaticGeoJson from '../../utils/StaticGeoJson';
import TooltipToggler from '../../utils/TooltipToggler';
import type L from 'leaflet';

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

{/* Styles for selected and non selected watersheds */}
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
  watershedId: string;
}

/**
 * Fetches basic watershed border data from the API.
 * 
 * @returns {Promise<Object>} A promise that resolves to the JSON response containing watershed data.
 * @throws {Error} Throws an error if the API request fails.
 */
export async function fetchWatersheds() {
  const response = await fetch(API_ENDPOINTS.WATERSHEDS);
  if (!response.ok) throw new Error('Failed to fetch watersheds');
  return response.json(); // must return the same data shape for both
}

/**
 * Handles the map of our application and contains all of its controls
 * and watershed specific workflows.
 *
 * @param watershedId - Watershed ID taken from the useMatch hook in @see {@link Home} page.
 * @returns {JSX.Element} - A Leaflet map that contains our GIS watershed data.
 */
export default function Map({ watershedId }: MapProps) {
  const { data: watersheds, error, isLoading } = useQuery({
    queryKey: ['watersheds'],
    queryFn: fetchWatersheds
  });

  {/* Navigates to a watershed on click */}
  const navigate = useNavigate();

  const onWatershedClick = (e: any) => {
    const layer = e.sourceTarget;
    const feature = layer.feature;
  
    navigate({
      to: `/watershed/${feature.id}`,
    });
  };
  
  if (error) return <div>Error: {error.message}</div>;

  // Remove zoomLevel state because TooltipToggler will handle zoom changes.
  const thresholdZoom = 10;
  const geoJsonRef = useRef<L.GeoJSON>(null);

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
          {isLoading && (
            <div className="map-loading-overlay">
              <div className="loading-spinner"></div>
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
          <MapEffect watershedId={watershedId} watersheds={watersheds} />

          {watersheds && (
          <StaticGeoJson
            ref={geoJsonRef}
            data={watersheds}
            style={(feature) =>
              feature.id?.toString() === watershedId
                ? selectedStyle
                : defaultStyle
            }
            onEachFeature={(feature, layer) => {
              // bind click-navigation
              layer.on({ click: onWatershedClick });
              // bind tooltip
              if (feature.properties?.watershed_name) {
                layer.bindTooltip(feature.properties.watershed_name, {
                  permanent: false,
                  direction: 'center',
                });
              }
            }}
          />
        )}

        {/* TooltipToggler takes care of re-binding the tooltips based on zoom level */}
        <TooltipToggler geoJsonRef={geoJsonRef} threshold={thresholdZoom} />
      </MapContainer>
    </div>
  );
}
