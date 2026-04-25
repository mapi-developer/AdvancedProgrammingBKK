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
  const [selectedRoutes, setSelectedRoutes] = useState<any[]>([]); // New Route Pool State
  const [showAccessible, setShowAccessible] = useState(true);
  const [showInaccessible, setShowInaccessible] = useState(true);

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

  // --- FILTERING ENGINE ---
  const filteredVehicles = useMemo(() => {
    return Object.values(vehicles).filter((v: any) => {
      const route = routeMap[v.route_id];
      if (!route) return false;
      
      const category = getTransportCategory(route.type);
      const isTypeActive = activeTypes.has(category);
      const isRouteInPool = selectedRoutes.some(sr => sr.id === v.route_id);

      // Show if category is ON OR if specific line is in pool
      return isTypeActive || isRouteInPool;
    });
  }, [vehicles, routeMap, activeTypes, selectedRoutes]);

  const filteredStops = useMemo(() => {
    if (!stops) return null;
    const features = stops.features.filter((f: any) => {
      // 1. Master Accessibility Check
      const isAcc = f.properties.wheelchair_boarding === 1;
      if (isAcc && !showAccessible) return false;
      if (!isAcc && !showInaccessible) return false;

      // 2. Data check: Is this stop served by an active mode or a pooled route?
      const stopRouteIds = f.properties.route_ids || [];
      const hasActiveMode = stopRouteIds.some((rid: string) => {
        const r = routeMap[rid];
        return r && activeTypes.has(getTransportCategory(r.type));
      });
      const hasPooledRoute = stopRouteIds.some((rid: string) => 
        selectedRoutes.some(sr => sr.id === rid)
      );

      return hasActiveMode || hasPooledRoute;
    });
    return { ...stops, features };
  }, [stops, routeMap, activeTypes, selectedRoutes, showAccessible, showInaccessible]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden font-sans">
      <SiteHeader />
      <div className="flex-1 flex flex-row overflow-hidden">
        <FilterPanel 
          activeTypes={activeTypes}
          setActiveTypes={setActiveTypes}
          selectedRoutes={selectedRoutes}
          setSelectedRoutes={setSelectedRoutes}
          showAccessible={showAccessible}
          setShowAccessible={setShowAccessible}
          showInaccessible={showInaccessible}
          setShowInaccessible={setShowInaccessible}
          visibleVehicleCount={filteredVehicles.length}
          visibleStationCount={filteredStops?.features.length || 0}
          routeMap={routeMap}
          getCategory={getTransportCategory}
        />
        <main className="flex-1 relative z-0">
          <DynamicMap stops={filteredStops} vehicles={filteredVehicles} routeMap={routeMap} />
        </main>
      </div>
    </div>
  );
}