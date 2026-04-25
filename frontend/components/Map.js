'use client'; 

import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [25, 25],
});

export default function Map({ stopsGeoJSON, liveVehicles, routeMap, showStops }) {
  const position = [47.4979, 19.0402]; 

  return (
    <MapContainer center={position} zoom={12} style={{ height: '100vh', width: '100%', zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Conditionally render stops based on the sidebar toggle */}
      {showStops && stopsGeoJSON && (
        <GeoJSON 
          data={stopsGeoJSON} 
          pointToLayer={(feature, latlng) => {
            const color = feature.properties.wheelchair_boarding === 1 ? 'green' : 'red';
            return L.circleMarker(latlng, { radius: 5, color, fillColor: color, fillOpacity: 0.8 });
          }}
        />
      )}

      {/* Render the pre-filtered array of live vehicles */}
      {liveVehicles && liveVehicles.map((vehicle) => {
        // Safely map the route ID to the human-readable line name (e.g. BKK_3010 -> Tram 4)
        const routeName = routeMap && routeMap[vehicle.route_id] 
          ? routeMap[vehicle.route_id].name 
          : vehicle.route_id;

        return (
          <Marker 
            key={vehicle.vehicle_id} 
            position={[vehicle.lat, vehicle.lon]} 
            icon={busIcon}
          >
            <Popup>
              <strong>Line: {routeName}</strong><br/>
              Vehicle ID: {vehicle.vehicle_id}<br/>
              Status: Live
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}