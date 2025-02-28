import { MapContainer, TileLayer, GeoJSON, ScaleControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import { useMatch } from '@tanstack/react-router';
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
import { useEffect } from 'react';
import L from 'leaflet';

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

interface MapProps {
  isSideContentOpen: boolean;
  setIsSideContentOpen: (open: boolean) => void;
}

export default function Map({ isSideContentOpen, setIsSideContentOpen }: MapProps) {
  // Fetch watersheds
  const fetchWatersheds = async () => {
    const response = await fetch('http://localhost:8000/api/watershed/borders-basic/');
    if (!response.ok) throw new Error('Failed to fetch watersheds');
    return response.json();
  };

  const { data: watersheds, error, isLoading } = useQuery({
    queryKey: ['watersheds'],
    queryFn: fetchWatersheds
  });

  const WatershedRouteHandler = () => {
    const map = useMap();
    const match = useMatch({
      from: '/watershed/$watershedId',
    });
    
    useEffect(() => {
      if (!match || !match.params || !watersheds) {
        return;
      }
      
      const watershedId = match.params.watershedId;
      
      if (!watershedId) {
        return;
      }
      
      // Find the selected watershed based on the ID from URL params
      const selectedFeature = watersheds.features.find((feature: { properties: { id: any; pws_id: any; watershed_id: any; objectid: any; }; }) => {
        if (!feature.properties) return false;
        
        // Try multiple potential ID fields
        const potentialIds = [
          feature.properties.id,
          feature.properties.pws_id,
          feature.properties.watershed_id,
          feature.properties.objectid
        ];
        
        return potentialIds.some(id => 
          id != null && id.toString() === watershedId
        );
      });
      
      if (!selectedFeature) {
        console.warn(`Watershed with ID ${watershedId} not found`);
        return;
      }
      
      // Zoom to the selected watershed
      const geoJsonLayer = L.geoJSON(selectedFeature);
      const bounds = geoJsonLayer.getBounds();
      map.flyToBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 12
      });
      
    }, [map, match, watersheds]);
    
    return null;
  };

  if (error) return <div>Error: {error.message}</div>;

  const onWatershedClick = (e: any) => {
    const layer = e.sourceTarget;
    const feature = layer.feature;
    console.log('Clicked watershed:', feature);
    zoomToFeature(layer._map, layer);
  };

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

          {/* Component handling dynamic routing and zoom */}
          <WatershedRouteHandler />
        </>
      </MapContainer>
    </div>
  );
}