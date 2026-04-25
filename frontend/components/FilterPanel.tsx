import { Bus, Train, TramFront, Search, X, RotateCcw } from "lucide-react";

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
        backgroundColor: checked ? activeColor : 'var(--color-muted-foreground)' 
      }}
    />
  </button>
);

export const FilterPanel = ({
  activeTypes, toggleType, searchQuery, setSearchQuery,
  showAccessible, setShowAccessible, showInaccessible, setShowInaccessible,
  visibleVehicleCount, visibleStationCount, resetFilters
}: any) => {
  return (
    <aside className="w-[320px] shrink-0 border-r border-border bg-surface/30 flex flex-col h-full relative z-[1000]">
      {/* Header section with Reset */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-background/20">
        <div>
          <div className="label-eyebrow">Filters</div>
          <h1 className="font-serif-display text-xl text-foreground mt-0.5 tracking-tight">Refine View</h1>
        </div>
        <button 
          onClick={resetFilters}
          className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-surface-2"
          title="Reset all filters"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* 1. Transport Types */}
        <div>
          <div className="label-eyebrow mb-4">Transport Type</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TRANSPORT_META).map(([key, meta]) => {
              const isActive = activeTypes.has(key);
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  onClick={() => toggleType(key)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                    isActive ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border/40 bg-transparent text-muted-foreground hover:border-border'
                  }`}
                >
                  {/* Dynamic Color Logic: meta.color if active, gray if inactive */}
                  <span 
                    className="h-1.5 w-1.5 rounded-full transition-colors duration-200" 
                    style={{ backgroundColor: isActive ? meta.color : '#4b5563' }} 
                  />
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Route Search */}
        <div>
          <div className="label-eyebrow mb-4">Route Selection</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search line (M3, 4, 6)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/50 border border-border/50 rounded-md pl-9 pr-9 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
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

      {/* Footer statistics grid */}
      <div className="border-t border-border px-6 py-5 grid grid-cols-2 gap-4 bg-background/40 backdrop-blur-md">
        <div>
          <div className="label-eyebrow">Stations</div>
          <div className="font-serif-display text-2xl tabular-nums text-foreground">{visibleStationCount}</div>
        </div>
        <div>
          <div className="label-eyebrow">Live Vehicles</div>
          <div className="font-serif-display text-2xl tabular-nums text-primary shadow-primary/20 drop-shadow-sm">{visibleVehicleCount}</div>
        </div>
      </div>
    </aside>
  );
};