'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  // Data State
  const [stops, setStops] = useState(null);
  const [vehicles, setVehicles] = useState({});
  const [routeMap, setRouteMap] = useState({});
  
  // UI Control State
  const [showAllVehicles, setShowAllVehicles] = useState(true); // Master Toggle for Vehicles
  const [showAllStops, setShowAllStops] = useState(false);      // Master Toggle for Stops
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ tram: true, bus: true, metro: true });

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/stops').then(res => res.json()).then(data => setStops(data));
    fetch('http://localhost:8000/api/v1/routes').then(res => res.json()).then(data => setRouteMap(data));

    const ws = new WebSocket('ws://localhost:8000/ws/vehicles');
    ws.onmessage = (event) => {
      const vehicle = JSON.parse(event.data);
      setVehicles(prev => ({ ...prev, [vehicle.vehicle_id]: vehicle }));
    };
    return () => ws.close();
  }, []);

  const getTransportCategory = (typeCode) => {
    if (typeCode === 0) return 'tram';
    if (typeCode === 1) return 'metro';
    if (typeCode === 3 || typeCode === 11 || typeCode === 800) return 'bus'; 
    return 'other';
  };

  // --- VEHICLE FILTERING ENGINE ---
  const visibleVehicles = Object.values(vehicles).filter(vehicle => {
    // 1. If "Show All" is checked, bypass all filters and show everything!
    if (showAllVehicles) return true;

    const routeInfo = routeMap[vehicle.route_id];
    if (!routeInfo) return false;

    // 2. Search Bar Filter
    if (searchQuery && !routeInfo.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // 3. Checkbox Type Filter
    const category = getTransportCategory(routeInfo.type);
    if (category === 'tram' && !filters.tram) return false;
    if (category === 'bus' && !filters.bus) return false;
    if (category === 'metro' && !filters.metro) return false;

    return true;
  });

  // --- STOP FILTERING ENGINE ---
  // useMemo prevents re-calculating the 6000 stops on every frame unless inputs change
  const visibleStops = useMemo(() => {
    if (!stops) return null;
    
    // 1. If "Show All" is checked, dump all 6000+ stops to the map
    if (showAllStops) return stops; 

    // 2. If no search query and "Show All" is false, show a clean map (empty array)
    if (!searchQuery) return { ...stops, features: [] };

    // 3. Filter stops based on whether their route array contains the searched line
    const filteredFeatures = stops.features.filter(feature => {
        const stopRouteIds = feature.properties.route_ids || [];
        return stopRouteIds.some(r_id => {
            const rInfo = routeMap[r_id];
            return rInfo && rInfo.name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    });

    return { ...stops, features: filteredFeatures };
  }, [stops, showAllStops, searchQuery, routeMap]);


  return (
    <main className="relative flex min-h-screen">
      <div className="absolute z-[1000] top-4 left-4 w-80 bg-white/95 p-5 rounded-xl shadow-2xl border border-gray-200 backdrop-blur-sm">
        <h1 className="text-2xl font-black text-gray-900 mb-1">BKK Live Transit</h1>
        <p className="text-sm text-gray-500 mb-6 pb-4 border-b">Real-time Spatial Dashboard</p>

        {/* Master Toggles */}
        <div className="space-y-3 mb-6 bg-gray-100 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-blue-900">SHOW ALL Vehicles</label>
            <input 
              type="checkbox" 
              className="w-5 h-5 text-blue-600 cursor-pointer"
              checked={showAllVehicles} 
              onChange={(e) => setShowAllVehicles(e.target.checked)} 
            />
          </div>
          <div className="flex items-center justify-between border-t border-gray-300 pt-3">
            <label className="font-bold text-sm text-gray-800">SHOW ALL Stops</label>
            <input 
              type="checkbox" 
              className="w-5 h-5 text-blue-600 cursor-pointer"
              checked={showAllStops} 
              onChange={(e) => setShowAllStops(e.target.checked)} 
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Filter Specific Line (e.g., M3, 4)</label>
          <input 
            type="text" 
            placeholder="Type line number..."
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Pro-Tip: Automatically uncheck "Show All" so the user can immediately see their filtered results
              if (e.target.value.length > 0) {
                  setShowAllVehicles(false);
                  setShowAllStops(false);
              }
            }}
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
                disabled={showAllVehicles} // Disable checkboxes if "Show All" is overriding them
                onChange={(e) => setFilters(prev => ({ ...prev, [type]: e.target.checked }))}
              />
              <label htmlFor={type} className={`ml-3 text-sm capitalize ${showAllVehicles ? 'text-gray-400' : 'text-gray-700 cursor-pointer'}`}>
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
      
      <div className="w-full h-screen">
        {/* Pass the new visibleStops logic down to the map. No changes needed in Map.js! */}
        <DynamicMap 
          stopsGeoJSON={visibleStops} 
          liveVehicles={visibleVehicles} 
          routeMap={routeMap} 
          showStops={true} // Keep true, as visibility is now controlled natively by visibleStops logic
        />
      </div>
    </main>
  );
}