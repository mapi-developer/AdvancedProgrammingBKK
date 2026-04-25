'use client';

import { useEffect, useState, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import Link from "next/link";
import { 
  ArrowRight, ChevronRight, CircleCheck, CircleAlert, 
  Bus, Train, TramFront, MapPin, Radio, Accessibility 
} from "lucide-react";

// Reusable Stat Component for the Top Hero Stats
const Stat = ({ value, label, accent, loading }: { value: string | number; label: string; accent?: string; loading?: boolean }) => (
  <div className="panel-raised p-6 border border-border/50 hover:border-border transition-colors flex flex-col items-start text-left min-h-[120px]">
    {loading ? (
      <div className="h-10 w-24 bg-surface-2 animate-pulse rounded mb-2" />
    ) : (
      <div className={`font-serif-display text-4xl md:text-5xl tabular-nums tracking-tight ${accent ?? "text-foreground"}`}>
        {value}
      </div>
    )}
    <div className="label-eyebrow mt-3">{label}</div>
  </div>
);

export default function HomePage() {
  const [data, setData] = useState<{ stops: any; routes: any } | null>(null);
  const [liveVehicles, setLiveVehicles] = useState(0);

  useEffect(() => {
    // 1. Fetch Static Data
    Promise.all([
      fetch('http://localhost:8000/api/v1/stops').then(res => res.json()),
      fetch('http://localhost:8000/api/v1/routes').then(res => res.json())
    ]).then(([stops, routes]) => {
      setData({ stops, routes });
    }).catch(err => console.error("Data fetch error:", err));

    // 2. Connect to WebSocket just to count live vehicles for the hero stat
    const ws = new WebSocket('ws://localhost:8000/ws/vehicles');
    let count = 0;
    const vehicleSet = new Set();
    ws.onmessage = (event) => {
      const v = JSON.parse(event.data);
      vehicleSet.add(v.vehicle_id);
      setLiveVehicles(vehicleSet.size);
    };
    return () => ws.close();
  }, []);

  // --- LOGIC: DYNAMIC CALCULATIONS ---
  const stats = useMemo(() => {
    if (!data) return null;
    const totalStops = data.stops.features.length;
    const accessibleStops = data.stops.features.filter((f: any) => f.properties.wheelchair_boarding === 1).length;
    const totalRoutes = Object.keys(data.routes).length;
    
    // Breakdown calculations
    const getCategory = (type: number) => {
      if (type === 0) return 'tram';
      if (type === 1) return 'metro';
      if (type === 109) return 'hev';
      return 'bus';
    };

    const categories = {
      metro: { label: 'Metro', icon: Train, color: '#60A5FA' },
      bus: { label: 'Bus Network', icon: Bus, color: '#3B82F6' },
      tram: { label: 'Tram Lines', icon: TramFront, color: '#FDE047' },
      hev: { label: 'Suburban Railway', icon: Train, color: '#22C55E' }
    };

    const breakdown = Object.entries(categories).map(([key, meta]) => {
      // Find stops belonging to this category
      const catStops = data.stops.features.filter((f: any) => {
        const stopRouteIds = f.properties.route_ids || [];
        return stopRouteIds.some((rid: string) => {
          const r = data.routes[rid];
          return r && getCategory(r.type) === key;
        });
      });

      const total = catStops.length;
      const accessible = catStops.filter((s: any) => s.properties.wheelchair_boarding === 1).length;
      const barrier = total - accessible;
      const pct = total > 0 ? Math.round((accessible / total) * 100) : 0;

      return { type: key, ...meta, total, accessible, barrier, pct };
    });

    return {
      totalStops,
      accessibilityPct: Math.round((accessibleStops / totalStops) * 100),
      totalRoutes,
      breakdown
    };
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-70 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 bg-glow pointer-events-none" aria-hidden />

        <div className="container mx-auto px-6 pt-24 pb-24 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-8 shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              System Online · Real-Time Tracking
            </div>

            <h1 className="font-serif-display text-5xl md:text-7xl leading-[0.95] mb-8">
              Mapping Budapest's transit,
              <br />
              <span className="text-muted-foreground">one accessible stop at a time.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed mb-10">
              An open research project analysing wheelchair accessibility across every BKK station — Bus, Tram, Metro and HÉV — combined with realtime vehicle data.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/map" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all duration-300 shadow-glow hover:bg-primary/90 hover:-translate-y-0.5">
                Explore the live map <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#research" className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 px-6 py-3 text-sm font-bold hover:bg-surface-2 transition-colors">
                Read the research <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Top Hero Stats - NOW DYNAMIC */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
            <Stat value={stats?.totalStops.toLocaleString() || "6,000+"} label="Stations analysed" loading={!stats} />
            <Stat value={`${stats?.accessibilityPct || 70}%`} label="Currently accessible" accent="text-success" loading={!stats} />
            <Stat value={stats?.totalRoutes.toLocaleString() || "340+"} label="Routes covered" loading={!stats} />
            <Stat value={liveVehicles > 0 ? liveVehicles.toLocaleString() : "1,500+"} label="Vehicles tracked" accent="text-primary" />
          </div>
        </div>
      </main>

      {/* 3. Research Breakdown Section - NOW DYNAMIC */}
      <section id="research" className="border-b border-border bg-surface/30">
        <div className="container mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="label-eyebrow mb-4 text-primary">01 — Research</div>
              <h2 className="font-serif-display text-4xl leading-tight mb-6 text-foreground">
                What the data tells us about accessibility in Budapest.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Budapest's transit network spans more than a century. Newer lines like M4 are fully accessible, while heritage lines like M1 still present hard barriers.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We combine GTFS metadata with realtime feeds to produce a rider-focused view of accessibility today.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(stats?.breakdown || []).map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.type} className="panel p-6 group hover:border-foreground/30 transition-colors shadow-sm">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background shadow-inner">
                          <Icon className="h-5 w-5" style={{ color: b.color }} />
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-sm">{b.label}</div>
                          <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
                            {b.total.toLocaleString()} stations
                          </div>
                        </div>
                      </div>
                      <div className="font-serif-display text-3xl tabular-nums tracking-tighter" style={{ color: b.color }}>
                        {b.pct}%
                      </div>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-background border border-border overflow-hidden mb-5">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${b.pct}%`, backgroundColor: b.color }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <CircleCheck className="h-3.5 w-3.5 text-success" />
                        <span className="text-foreground">{b.accessible.toLocaleString()}</span> accessible
                      </span>
                      <span className="flex items-center gap-2">
                        <CircleAlert className="h-3.5 w-3.5 text-danger" />
                        <span className="text-foreground">{b.barrier.toLocaleString()}</span> barrier
                      </span>
                    </div>
                  </div>
                );
              })}
              {!stats && [1,2,3,4].map(i => <div key={i} className="panel h-[180px] animate-pulse bg-surface/50" />)}
            </div>

          </div>
        </div>
      </section>

      {/* 4. Methodology Section */}
      <section id="methodology" className="border-b border-border bg-background">
        <div className="container mx-auto px-6 py-24">
          <div className="label-eyebrow mb-4 text-primary">02 — Methodology</div>
          <h2 className="font-serif-display text-4xl leading-tight mb-12 max-w-2xl text-foreground">
            From open data to rider-focused insight.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Radio,
                step: "Step 01",
                title: "Ingest GTFS feeds",
                body: "We pull BKK's static GTFS for stations and routes, plus the GTFS-Realtime feed for live vehicle positions and delays.",
              },
              {
                icon: Accessibility,
                step: "Step 02",
                title: "Score accessibility",
                body: "Each stop is classified using the official wheelchair_boarding flag, cross-referenced with crowd-sourced reports and on-site verification.",
              },
              {
                icon: MapPin,
                step: "Step 03",
                title: "Visualise in context",
                body: "Stations and live vehicles are rendered together so riders can see not just whether a stop is accessible, but whether the next vehicle is too.",
              },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={title} className="panel p-6 hover:border-primary/40 transition-colors shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 border border-primary/30 mb-5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="label-eyebrow mb-2 text-muted-foreground">{step}</div>
                <h3 className="font-serif-display text-2xl mb-3 text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA / Live Map Section */}
      <section className="border-b border-border bg-background">
        <div className="container mx-auto px-6 py-24">
          <div className="panel p-12 md:p-16 relative overflow-hidden shadow-sm">
            {/* Inner background grid limited strictly to this card */}
            <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
            
            {/* Increased to max-w-4xl to give the title room to breathe */}
            <div className="relative max-w-4xl z-10">
              <div className="label-eyebrow mb-4 text-primary">03 — Live Map</div>
              
              {/* Added sm:whitespace-nowrap to keep it on one row */}
              <h2 className="font-serif-display text-3xl sm:text-4xl md:text-5xl leading-tight mb-6 text-foreground sm:whitespace-nowrap">
                See the network breathe in realtime.
              </h2>
              
              {/* Moved max-w-2xl down to the paragraph so it still wraps nicely */}
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                Filter by transport type or route, toggle accessibility, and watch live
                vehicles move across Budapest. Green dots mark accessible stations, red
                ones mark barriers.
              </p>
              
              <Link
                href="/map"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all duration-300 shadow-glow hover:bg-primary/90 hover:-translate-y-0.5"
              >
                Open the live map
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
        
    </div>
  );
}