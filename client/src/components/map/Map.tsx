import { MapContainer, TileLayer, GeoJSON, ScaleControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import { useQuery } from '@tanstack/react-query';
import ZoomInControl from './controls/ZoomIn/ZoomIn';
import ZoomOutControl from './controls/ZoomOut/ZoomOut';
import ExpandControl from './controls/Expand/Expand';
import LayersControl from './controls/Layers/Layers';
import LegendControl from './controls/Legend/Legend';
import SearchControl from './controls/Search/Search';
import SettingsControl from './controls/Settings/Settings';
import UserLocationControl from './controls/UserLocation/UserLocation';
import { zoomToFeature } from '../../utils/MapUtil';
import { useNavigate } from '@tanstack/react-router';
import { MapEffect } from '../../utils/MapEffectUtil';

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

/**
 * Interface for the @see {@link Map} function to enforce type safety.
 */
interface MapProps {
  isSideContentOpen: boolean;
  setIsSideContentOpen: (open: boolean) => void;
  watershedId: string;
}

/**
 * Handles the map of our application and contains all of its controls
 * and watershed specific workflows.
 * 
 * @param isSideContentOpen - Flag to check if sidecontent is open.
 * @param setIsSideContentOpen - Sets the sidecontent panels visibility based on @see {@link isSideContentOpen}.
 * @param watershedId - Watershed ID taken from the useMatch hook in @see {@link Home} page.
 * @returns {JSX.Element} - A Leaflet map that contains our GIS watershed data.
 */
export default function Map({ isSideContentOpen, setIsSideContentOpen, watershedId }: MapProps) {
  {/* Fetching watershed data */}
  const fetchWatersheds = async () => {
    const response = await fetch('http://localhost:8000/api/watershed/borders-basic/');
    if (!response.ok) throw new Error('Failed to fetch watersheds');
    return response.json();
  };

  const { data: watersheds, error, isLoading } = useQuery({
    queryKey: ['watersheds'],
    queryFn: fetchWatersheds
  });

  {/* Navigates to a watershed on click */}
  const navigate = useNavigate();

  const onWatershedClick = (e: any) => {
    console.log('Watershed click event:', e); // Add this line
    const layer = e.sourceTarget;
    const feature = layer.feature;
    console.log('Clicked watershed feature:', feature); // Add this line
    zoomToFeature(layer._map, layer);
  
    navigate({
      to: `/watershed/${feature.id}`,
    });
  };
  
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="map-container">
      <MapContainer
        center={CENTER}
        zoom={6}
        minZoom={6}
        maxZoom={13}
        zoomControl={false}
        doubleClickZoom={false}
        scrollWheelZoom={true}
        maxBounds={BOUNDS}
        maxBoundsViscosity={0.5}
        bounds={BOUNDS}
        style={{ height: '100%', width: '100%' }}
      >
        <>
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
            <ExpandControl isOpen={isSideContentOpen} setIsOpen={setIsSideContentOpen} />
          </div>
          
          {/* Handles URL navigation to a specified watershed */}
          <MapEffect watershedId={watershedId} watersheds={watersheds} />

          {watersheds && (
            <GeoJSON
              key={JSON.stringify(watersheds)}
              data={watersheds}
              style={() => ({
                color: '#4a83ec',
                weight: 1,
                fillColor: '#4a83ec',
                fillOpacity: 0.1,
              })}
              onEachFeature={(feature, layer) => {
                // Bind a popup for information
                layer.bindPopup(`
                  <strong>${feature.properties.pws_name}</strong><br/>
                  City: ${feature.properties.city}<br/>
                  County: ${feature.properties.cnty_name}<br/>
                  Acres: ${feature.properties.acres}
                `);
                // Attach the click event
                layer.on({
                  click: onWatershedClick,
                });
              }}
            />
          )}
        </>
      </MapContainer>
    </div>
  );
}