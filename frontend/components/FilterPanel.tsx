import { Bus, Train, TramFront, Search, X, RotateCcw, Plus, LayoutGrid, MapPin, Activity } from "lucide-react";
import { useState, useMemo } from "react";

const TRANSPORT_META = {
  tram: { label: "Tram", icon: TramFront, color: "#FDE047" },
  bus: { label: "Bus", icon: Bus, color: "#3B82F6" },
  metro: { label: "Metro", icon: Train, color: "#60A5FA" },
  hev: { label: "HÉV", icon: Train, color: "#22C55E" },
};

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
  displayMode, setDisplayMode, // Added
  visibleVehicleCount, visibleStationCount, routeMap, getCategory, resetFilters
}: any) => {
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    if (!query || !routeMap) return [];
    const lowerQuery = query.toLowerCase().trim();
    return Object.entries(routeMap)
      .map(([id, r]: [string, any]) => ({ id, ...r }))
      .filter((r: any) => {
        const category = getCategory(r.type);
        const matchesName = r.name.toLowerCase().includes(lowerQuery);
        const matchesCategory = category.toLowerCase() === lowerQuery;
        const typeIsActive = activeTypes.has(category);
        const alreadySelected = selectedRoutes.some((sr: any) => sr.id === r.id);
        return (matchesName || matchesCategory) && typeIsActive && !alreadySelected;
      })
      .sort((a, b) => {
        const aExact = a.name.toLowerCase() === lowerQuery;
        const bExact = b.name.toLowerCase() === lowerQuery;
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;
        const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
        const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;
        return a.name.length - b.name.length;
      })
      .slice(0, 60);
  }, [query, routeMap, selectedRoutes, activeTypes, getCategory]);

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
        <button onClick={resetFilters} className="p-2 text-muted-foreground hover:text-primary transition-colors hover:bg-surface-2 rounded-md">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        
        {/* NEW: Display Mode Toggle */}
        <div>
          <div className="label-eyebrow mb-4">Display Mode</div>
          <div className="flex bg-background/50 p-1 rounded-lg border border-border/50 relative">
            <button
              onClick={() => setDisplayMode('transport')}
              className={`flex-1 flex flex-col items-center py-2 gap-1 rounded-md transition-all z-10 ${displayMode === 'transport' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Transport</span>
            </button>
            <button
              onClick={() => setDisplayMode('stops')}
              className={`flex-1 flex flex-col items-center py-2 gap-1 rounded-md transition-all z-10 ${displayMode === 'stops' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Stops</span>
            </button>
            <button
              onClick={() => setDisplayMode('all')}
              className={`flex-1 flex flex-col items-center py-2 gap-1 rounded-md transition-all z-10 ${displayMode === 'all' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">All</span>
            </button>
            
            {/* Animated background indicator */}
            <div 
              className="absolute top-1 bottom-1 bg-surface-2 border border-border/50 rounded-md transition-all duration-300 ease-out z-0"
              style={{ 
                width: 'calc(33.33% - 4px)', 
                left: displayMode === 'transport' ? '4px' : displayMode === 'stops' ? '33.33%' : '66.66%' 
              }}
            />
          </div>
        </div>

        {/* 1. Transport Types */}
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
              placeholder="Search (e.g. 6, M3, tram...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-background/50 border border-border/50 rounded-md pl-9 pr-4 py-2 text-sm text-foreground focus:border-primary/50 outline-none transition-all"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-md shadow-2xl backdrop-blur-xl max-h-[280px] overflow-y-auto custom-scrollbar">
                {suggestions.map((r: any) => (
                  <button 
                    key={r.id} 
                    onClick={() => addRoute(r.id, r.name)} 
                    className="w-full px-4 py-2.5 hover:bg-primary/10 transition-colors flex justify-between items-center border-b border-border last:border-0 group text-left"
                  >
                    <span className="font-bold text-sm">
                      {r.name} <span className="text-[10px] text-muted-foreground ml-2 uppercase">({getCategory(r.type)})</span>
                    </span>
                    <Plus className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedRoutes.map((sr: any) => (
              <button 
                key={sr.id} 
                onClick={() => removeRoute(sr.id)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-primary/20 border border-primary/40 rounded text-[11px] font-bold text-primary hover:bg-primary/30 transition-all group shrink-0"
              >
                {sr.name}
                <X className="h-3 w-3 text-primary/60 group-hover:text-primary transition-colors" />
              </button>
            ))}
            {selectedRoutes.length === 0 && <p className="text-[11px] text-muted-foreground italic">No specific lines added.</p>}
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