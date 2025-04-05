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
import { API_ENDPOINTS } from '../../config/api';

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

export default function Map({
  isSideContentOpen,
  setIsSideContentOpen
}: {
  isSideContentOpen: boolean;
  setIsSideContentOpen: (open: boolean) => void;
}) {

  const fetchWatersheds = async () => {
    const response = await fetch(API_ENDPOINTS.WATERSHEDS);
    if (!response.ok) throw new Error('Failed to fetch watersheds');
    return response.json();
  };

  const { data: watersheds, error, isLoading } = useQuery({
    queryKey: ['watersheds'],
    queryFn: fetchWatersheds
  });

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

        {/* Scale control provided by React Leaflet */}
        <ScaleControl metric={true} imperial={true} />

        {/* TOP LEFT CONTROLS */}
        <div className='leaflet-top leaflet-left'>
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
          <ExpandControl
            isOpen={isSideContentOpen}
            setIsOpen={setIsSideContentOpen}
          />
        </div>

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
            layer.bindPopup(`
              Watershed: ${feature.properties.watershed_name}<br/>
              Watershed ID: ${feature.properties.watershed_id}<br/>
              Provider: ${feature.properties.pws_name}<br/>
              Provider ID: ${feature.properties.pws_id}<br/>
              City: ${feature.properties.city}<br/>
              County: ${feature.properties.county}<br/>
              State: ${feature.properties.state}<br/>
              Area: ${feature.properties.area_m2} m²<br/>
              HUC12 NHD: ${feature.properties.huc12_nhd}<br/>
              HUC12 wbd: ${feature.properties.huc12_wbd}
            `);
          }}
        />
      </MapContainer>
    </div>
  );
}