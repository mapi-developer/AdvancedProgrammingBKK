'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  const [stops, setStops] = useState(null);
  const [vehicles, setVehicles] = useState({});
  const [routeMap, setRouteMap] = useState({});
  
  // UI State Controls
  const [showAllVehicles, setShowAllVehicles] = useState(false); // Default to off
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ tram: true, bus: true, metro: true });

  useEffect(() => {
    // 1. Fetch Stops
    fetch('http://localhost:8000/api/v1/stops')
      .then(res => res.json())
      .then(data => setStops(data));

    // 2. Fetch Route Metadata (The mapping we just created)
    fetch('http://localhost:8000/api/v1/routes')
      .then(res => res.json())
      .then(data => setRouteMap(data));

    // 3. Open WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws/vehicles');
    ws.onmessage = (event) => {
      const vehicle = JSON.parse(event.data);
      setVehicles(prev => ({ ...prev, [vehicle.vehicle_id]: vehicle }));
    };

    return () => ws.close();
  }, []);

  // Helper to categorize GTFS route_type into our UI filters
  const getTransportCategory = (typeCode) => {
    if (typeCode === 0) return 'tram';
    if (typeCode === 1) return 'metro';
    // 3 is Bus, 11 and 800 are Trolleybuses (grouping them as 'bus' for UI)
    if (typeCode === 3 || typeCode === 11 || typeCode === 800) return 'bus'; 
    return 'other';
  };

  // --- THE FILTERING ENGINE ---
  const visibleVehicles = Object.values(vehicles).filter(vehicle => {
    if (!showAllVehicles && !searchQuery) return false; // Show nothing if toggle is off and no search

    const routeInfo = routeMap[vehicle.route_id];
    if (!routeInfo) return false; // Skip if metadata is missing

    // 1. Text Search Filter (Matches line like "M3" or "4")
    if (searchQuery) {
      if (!routeInfo.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }

    // 2. Checkbox Type Filter
    const category = getTransportCategory(routeInfo.type);
    if (category === 'tram' && !filters.tram) return false;
    if (category === 'bus' && !filters.bus) return false;
    if (category === 'metro' && !filters.metro) return false;

    return true;
  });

  return (
    <main className="relative flex min-h-screen">
      
      {/* Sidebar Control Panel */}
      <div className="absolute z-[1000] top-4 left-4 w-80 bg-white/95 p-5 rounded-xl shadow-2xl border border-gray-200 backdrop-blur-sm">
        <h1 className="text-2xl font-black text-gray-900 mb-1">BKK Live Transit</h1>
        <p className="text-sm text-gray-500 mb-6 pb-4 border-b">Real-time Spatial Dashboard</p>

        {/* Master Toggle */}
        <div className="flex items-center justify-between mb-6 bg-gray-100 p-3 rounded-lg">
          <label className="font-semibold text-gray-800">Stream Live Vehicles</label>
          <input 
            type="checkbox" 
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            checked={showAllVehicles} 
            onChange={(e) => setShowAllVehicles(e.target.checked)} 
          />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Search Line (e.g., M3, 4, 6)</label>
          <input 
            type="text" 
            placeholder="Type line number..."
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Type Filters */}
        <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Transport Type</label>
          
          {['tram', 'bus', 'metro'].map(type => (
            <div key={type} className="flex items-center">
              <input 
                type="checkbox" 
                id={type}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                checked={filters[type]}
                onChange={(e) => setFilters(prev => ({ ...prev, [type]: e.target.checked }))}
              />
              <label htmlFor={type} className="ml-3 text-sm text-gray-700 capitalize cursor-pointer">
                {type}
              </label>
            </div>
          ))}
        </div>

        {/* Analytics Readout */}
        <div className="text-sm font-semibold text-gray-800 flex justify-between">
          <span>Vehicles on Map:</span>
          <span className="text-blue-600 font-bold">{visibleVehicles.length}</span>
        </div>
      </div>
      
      {/* Map Rendering */}
      <div className="w-full h-screen">
        {/* Pass the fully filtered array to the map instead of the raw WebSocket data */}
        <DynamicMap stopsGeoJSON={stops} liveVehicles={visibleVehicles} routeMap={routeMap} />
      </div>
    </main>
  );
}