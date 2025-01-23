import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import { useQuery } from '@tanstack/react-query';

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

export default function Map() {

  const fetchWatersheds = async () => {
    const response = await fetch('http://localhost:8000/api/watershed/borders-basic/');
    if (!response.ok) throw new Error('Failed to fetch watersheds');
    return response.json();
  };

  const { data: watersheds, error, isLoading } = useQuery({
    queryKey: ['watersheds'],
    queryFn: fetchWatersheds
  });

  console.log(CENTER)
  console.log(BOUNDS)

  if (error) return <div>Error: {error.message}</div>;
  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="map-container">
      <MapContainer
        center={CENTER}
        zoom={6}
        minZoom={6}
        maxZoom={13}
        zoomControl={true}
        scrollWheelZoom={true}
        maxBounds={BOUNDS}
        maxBoundsViscosity={0.5}
        bounds={BOUNDS}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          data={watersheds}
          style={() => ({
            color: '#4a83ec',
            weight: 1,
            fillColor: '#4a83ec',
            fillOpacity: 0.1,
          })}
          onEachFeature={(feature, layer) => {
            layer.bindPopup(`
              <strong>${feature.properties.pws_name}</strong><br/>
              City: ${feature.properties.city}<br/>
              County: ${feature.properties.cnty_name}<br/>
              Acres: ${feature.properties.acres}
            `);
          }}
        />
      </MapContainer>
    </div>
  );
}