'use client';

import { MapContainer, TileLayer } from "react-leaflet";
import 'leaflet/dist/leaflet.css';

export const TransitMap = () => {
  return (
    <MapContainer 
      center={[47.4979, 19.0539]}
      zoom={13} 
      zoomControl={false} 
      scrollWheelZoom={true}
      className="h-full w-full z-0 outline-none grayscale-[20%]" // Subtle grayscale for cleaner look
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
    </MapContainer>
  );
};