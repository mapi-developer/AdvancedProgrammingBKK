import { Bus, Train, TramFront, Search, X, RotateCcw, Plus } from "lucide-react";
import { useState, useMemo } from "react";

const TRANSPORT_META = {
  tram: { label: "Tram", icon: TramFront, color: "#FDE047" },
  bus: { label: "Bus", icon: Bus, color: "#3B82F6" },
  metro: { label: "Metro", icon: Train, color: "#60A5FA" },
  hev: { label: "HÉV", icon: Train, color: "#22C55E" },
};

// Internal utility component for accessibility toggles
const CustomSwitch = ({ checked, onChange, activeColor }: any) => (
  <button
    onClick={onChange}
    className={`w-9 h-5 rounded-full transition-all duration-300 relative border border-border/50 focus:outline-none ${checked ? 'bg-surface' : 'bg-background'}`}
    style={{ borderColor: checked ? activeColor : '' }}
  >
    <div 
      className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-300 shadow-sm`}
      style={{ 
        left: checked ? '18px' : '4px',
        backgroundColor: checked ? activeColor : '#4b5563' 
      }}
    />
  </button>
);

export const FilterPanel = ({
  activeTypes, setActiveTypes, selectedRoutes, setSelectedRoutes,
  showAccessible, setShowAccessible, showInaccessible, setShowInaccessible,
  visibleVehicleCount, visibleStationCount, routeMap, getCategory, resetFilters
}: any) => {
  const [query, setQuery] = useState("");

  // Search suggestions for the Route Pool
  const suggestions = useMemo(() => {
    if (!query || !routeMap) return [];
    const lowerQuery = query.toLowerCase();
    return Object.entries(routeMap)
      .filter(([id, r]: any) => r.name.toLowerCase().includes(lowerQuery))
      .filter(([id]) => !selectedRoutes.some((sr: any) => sr.id === id))
      .slice(0, 6);
  }, [query, routeMap, selectedRoutes]);

  const addRoute = (id: string, name: string) => {
    setSelectedRoutes([...selectedRoutes, { id, name }]);
    setQuery("");
  };

  const removeRoute = (id: string) => {
    setSelectedRoutes(selectedRoutes.filter((r: any) => r.id !== id));
  };

  return (
    <aside className="w-[320px] shrink-0 border-r border-border bg-surface/30 flex flex-col h-full relative z-[1000]">
      <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-background/20">
        <div>
          <div className="label-eyebrow">Filters</div>
          <h1 className="font-serif-display text-xl text-foreground font-bold tracking-tight">Refine View</h1>
        </div>
        <button onClick={resetFilters} className="p-2 text-muted-foreground hover:text-primary transition-colors">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* 1. Transport Mode Selection */}
        <div>
          <div className="label-eyebrow mb-4">Transport Type</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TRANSPORT_META).map(([key, meta]) => {
              const isActive = activeTypes.has(key);
              return (
                <button 
                  key={key} 
                  onClick={() => {
                    const next = new Set(activeTypes);
                    isActive ? next.delete(key) : next.add(key);
                    setActiveTypes(next);
                  }} 
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all ${isActive ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border/40 text-muted-foreground hover:border-border'}`}
                >
                  <span 
                    className="h-1.5 w-1.5 rounded-full transition-colors" 
                    style={{ backgroundColor: isActive ? meta.color : '#4b5563' }} 
                  />
                  <meta.icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold uppercase">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Route Selection Pool */}
        <div>
          <div className="label-eyebrow mb-4">Route Selection Pool</div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search and add line..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-background/50 border border-border/50 rounded-md pl-9 pr-4 py-2 text-sm text-foreground focus:border-primary/50 outline-none transition-all"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-md shadow-2xl overflow-hidden backdrop-blur-xl">
                {suggestions.map(([id, r]: any) => (
                  <div key={id} onClick={() => addRoute(id, r.name)} className="px-4 py-2.5 hover:bg-primary/10 cursor-pointer flex justify-between items-center border-b border-border last:border-0 group">
                    <span className="font-bold text-sm">{r.name} <span className="text-[10px] text-muted-foreground ml-2 uppercase">({getCategory(r.type)})</span></span>
                    <Plus className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedRoutes.map((sr: any) => (
              <div key={sr.id} className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 border border-primary/40 rounded text-[11px] font-bold text-primary">
                {sr.name}
                <button onClick={() => removeRoute(sr.id)} className="hover:text-foreground"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Accessibility Toggles */}
        <div>
          <div className="label-eyebrow mb-4">Accessibility</div>
          <div className="space-y-2">
             <label className="flex items-center justify-between p-3 rounded-md border border-border/30 bg-background/20 hover:border-border transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-xs font-medium">Accessible</span>
              </div>
              <CustomSwitch checked={showAccessible} onChange={() => setShowAccessible(!showAccessible)} activeColor="var(--color-success)" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-md border border-border/30 bg-background/20 hover:border-border transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-danger" />
                <span className="text-xs font-medium">Barrier</span>
              </div>
              <CustomSwitch checked={showInaccessible} onChange={() => setShowInaccessible(!showInaccessible)} activeColor="var(--color-danger)" />
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 py-5 grid grid-cols-2 gap-4 bg-background/40 backdrop-blur-md">
        <div>
          <div className="label-eyebrow">Stations</div>
          <div className="font-serif-display text-2xl tabular-nums">{visibleStationCount.toLocaleString()}</div>
        </div>
        <div>
          <div className="label-eyebrow">Live Vehicles</div>
          <div className="font-serif-display text-2xl tabular-nums text-primary shadow-glow-sm">{visibleVehicleCount.toLocaleString()}</div>
        </div>
      </div>
    </aside>
  );
};