'use client';

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { FilterPanel } from "@/components/FilterPanel";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(
  () => import('@/components/TransitMap').then(m => m.TransitMap), 
  { ssr: false, loading: () => <div className="h-full w-full bg-background flex items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">Loading Engine...</div> }
);

export default function MapPage() {
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(['tram', 'bus', 'metro', 'hev']));
  const [searchQuery, setSearchQuery] = useState("");
  const [showAccessible, setShowAccessible] = useState(true);
  const [showInaccessible, setShowInaccessible] = useState(true);

  const toggleType = (type: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const resetFilters = () => {
    setActiveTypes(new Set(['tram', 'bus', 'metro', 'hev']));
    setSearchQuery("");
    setShowAccessible(true);
    setShowInaccessible(true);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <SiteHeader />
      
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left Sidebar: Fixed Width, Full Height */}
        <FilterPanel 
          activeTypes={activeTypes}
          toggleType={toggleType}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showAccessible={showAccessible}
          setShowAccessible={setShowAccessible}
          showInaccessible={showInaccessible}
          setShowInaccessible={setShowInaccessible}
          visibleVehicleCount={1530}
          visibleStationCount={6196}
          resetFilters={resetFilters}
        />

        {/* Right Content Area: Map takes remaining width */}
        <main className="flex-1 relative z-0">
          <DynamicMap />
        </main>
      </div>
    </div>
  );
}