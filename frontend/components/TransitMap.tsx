'use client';

import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const TransitMap = ({ stops, vehicles, routeMap, getCategory }: any) => {
  return (
    <MapContainer center={[47.4979, 19.0539]} zoom={13} zoomControl={false} className="h-full w-full">
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

      {/* Render Stops from PostGIS */}
      {stops?.features?.map((f: any) => (
        <CircleMarker 
          key={f.properties.stop_id}
          center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
          radius={4}
          pathOptions={{ 
            fillColor: f.properties.wheelchair_boarding === 1 ? 'var(--color-success)' : 'var(--color-danger)', 
            fillOpacity: 0.8, 
            weight: 0 
          }}
        >
          <Popup>{f.properties.stop_name}</Popup>
        </CircleMarker>
      ))}

      {/* Render Realtime Vehicles from Kafka */}
      {vehicles.map((v: any) => {
        const route = routeMap[v.route_id];
        return (
          <Marker 
            key={v.vehicle_id} 
            position={[v.lat, v.lon]}
            icon={L.divIcon({
               className: 'custom-div-icon',
               html: `<div class="w-6 h-6 rounded bg-primary text-black font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-lg">${route?.name || '...'}</div>`
            })}
          >
            <Popup>Vehicle {v.vehicle_id} on Line {route?.name}</Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};