'use client';

import { useEffect, useState, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { FilterPanel } from "@/components/FilterPanel";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(
  () => import('@/components/TransitMap').then(m => m.TransitMap), 
  { ssr: false, loading: () => <div className="h-full w-full bg-background flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Engine...</div> }
);

export default function MapPage() {
  const [stops, setStops] = useState<any>(null);
  const [routeMap, setRouteMap] = useState<any>({});
  const [vehicles, setVehicles] = useState<Record<string, any>>({});
  
  // UI State
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(['tram', 'bus', 'metro', 'hev']));
  const [selectedRoutes, setSelectedRoutes] = useState<any[]>([]); 
  const [showAccessible, setShowAccessible] = useState(true);
  const [showInaccessible, setShowInaccessible] = useState(true);
  // NEW: Display Mode State
  const [displayMode, setDisplayMode] = useState<'all' | 'transport' | 'stops'>('all');

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/stops').then(res => res.json()).then(setStops).catch(console.error);
    fetch('http://localhost:8000/api/v1/routes').then(res => res.json()).then(setRouteMap).catch(console.error);

    const ws = new WebSocket('ws://localhost:8000/ws/vehicles');
    ws.onmessage = (event) => {
      const vehicle = JSON.parse(event.data);
      setVehicles(prev => ({ ...prev, [vehicle.vehicle_id]: vehicle }));
    };
    return () => ws.close();
  }, []);

  const getTransportCategory = (typeCode: number) => {
    if (typeCode === 0) return 'tram';
    if (typeCode === 1) return 'metro';
    if (typeCode === 109) return 'hev';
    if ([3, 11, 800].includes(typeCode)) return 'bus';
    return 'other';
  };

  const isRouteVisible = (routeId: string) => {
    const route = routeMap[routeId];
    if (!route) return false;
    const category = getTransportCategory(route.type);
    if (!activeTypes.has(category)) return false;
    if (selectedRoutes.length > 0) {
      return selectedRoutes.some(sr => sr.id === routeId);
    }
    return true;
  };

  const filteredVehicles = useMemo(() => {
    // Logic: Hide all vehicles if mode is 'stops'
    if (displayMode === 'stops') return [];
    return Object.values(vehicles).filter((v: any) => isRouteVisible(v.route_id));
  }, [vehicles, routeMap, activeTypes, selectedRoutes, displayMode]);

  const filteredStops = useMemo(() => {
    // Logic: Hide all stops if mode is 'transport'
    if (!stops || displayMode === 'transport') return null;
    const features = stops.features.filter((f: any) => {
      const isAcc = f.properties.wheelchair_boarding === 1;
      if (isAcc && !showAccessible) return false;
      if (!isAcc && !showInaccessible) return false;
      const stopRouteIds = f.properties.route_ids || [];
      return stopRouteIds.some((rid: string) => isRouteVisible(rid));
    });
    return { ...stops, features };
  }, [stops, routeMap, activeTypes, selectedRoutes, showAccessible, showInaccessible, displayMode]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden font-sans">
      <SiteHeader />
      <div className="flex-1 flex flex-row overflow-hidden">
        <FilterPanel 
          activeTypes={activeTypes} setActiveTypes={setActiveTypes}
          selectedRoutes={selectedRoutes} setSelectedRoutes={setSelectedRoutes}
          showAccessible={showAccessible} setShowAccessible={setShowAccessible}
          showInaccessible={showInaccessible} setShowInaccessible={setShowInaccessible}
          // NEW Props
          displayMode={displayMode} setDisplayMode={setDisplayMode}
          visibleVehicleCount={filteredVehicles.length}
          visibleStationCount={filteredStops?.features.length || 0}
          routeMap={routeMap} getCategory={getTransportCategory}
          resetFilters={() => {
            setActiveTypes(new Set(['tram', 'bus', 'metro', 'hev']));
            setSelectedRoutes([]);
            setShowAccessible(true);
            setShowInaccessible(true);
            setDisplayMode('all');
          }}
        />
        <main className="flex-1 h-full relative z-0">
          <DynamicMap stops={filteredStops} vehicles={filteredVehicles} routeMap={routeMap} />
        </main>
      </div>
    </div>
  );
}