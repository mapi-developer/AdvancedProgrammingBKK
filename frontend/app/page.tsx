'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Map component, completely disabling Server-Side Rendering
const DynamicMap = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  const [stops, setStops] = useState(null);
  const [vehicles, setVehicles] = useState({});

  useEffect(() => {
    // 1. Fetch Static Accessibility Data from PostGIS via FastAPI
    fetch('http://localhost:8000/api/v1/stops')
      .then(res => res.json())
      .then(data => setStops(data))
      .catch(err => console.error("Error fetching stops:", err));

    // 2. Open WebSocket for Real-Time Vehicles from Kafka via FastAPI
    const ws = new WebSocket('ws://localhost:8000/ws/vehicles');
    
    ws.onmessage = (event) => {
      const vehicle = JSON.parse(event.data);
      
      // Update state using vehicle_id to overwrite old locations and prevent duplicates
      setVehicles(prev => ({
        ...prev,
        [vehicle.vehicle_id]: vehicle
      }));
    };

    return () => ws.close(); // Clean up connection if the user leaves the page
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between">
      {/* Floating UI Dashboard Panel */}
      <div className="absolute z-[1000] top-4 left-4 bg-white/90 p-4 rounded-lg shadow-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">BKK Live Transit</h1>
        <div className="text-sm text-gray-700 space-y-1">
          <p>🟢 Accessible Stops</p>
          <p>🔴 Non-Accessible Stops</p>
          <p className="font-semibold mt-2 border-t pt-2">
            Active Vehicles: {Object.keys(vehicles).length}
          </p>
        </div>
      </div>
      
      {/* Render the Map */}
      <div className="w-full h-screen">
        <DynamicMap stopsGeoJSON={stops} liveVehicles={vehicles} />
      </div>
    </main>
  );
}