'use client'; // Required for Next.js App Router

import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons not loading correctly in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A custom bus icon for our live vehicles
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', // Free temporary icon
  iconSize: [25, 25],
});

export default function Map({ stopsGeoJSON, liveVehicles }) {
  // Center map on Budapest
  const position = [47.4979, 19.0402]; 

  return (
    <MapContainer center={position} zoom={12} style={{ height: '100vh', width: '100%' }}>
      {/* Free OpenStreetMap Base Layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Phase 1 Data: Render accessible/non-accessible stops */}
      {stopsGeoJSON && (
        <GeoJSON 
          data={stopsGeoJSON} 
          pointToLayer={(feature, latlng) => {
            // Color code based on wheelchair accessibility
            const color = feature.properties.wheelchair_boarding === 1 ? 'green' : 'red';
            return L.circleMarker(latlng, { radius: 5, color, fillColor: color, fillOpacity: 0.8 });
          }}
        />
      )}

      {/* Phase 2 Data: Render live streaming vehicles */}
      {Object.values(liveVehicles).map((vehicle) => (
        <Marker 
          key={vehicle.vehicle_id} 
          position={[vehicle.lat, vehicle.lon]} 
          icon={busIcon}
        >
          <Popup>
            <strong>Route: {vehicle.route_id}</strong><br/>
            Vehicle ID: {vehicle.vehicle_id}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}