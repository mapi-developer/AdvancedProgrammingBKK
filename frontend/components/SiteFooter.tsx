import Link from "next/link";
import { MapPin } from "lucide-react";

export const SiteFooter = () => {
  return (
    <footer className="border-t border-border bg-background pt-16 pb-8">
      <div className="container mx-auto px-6">
        
        {/* Top Section: Brand & Links */}
        {/* Changed to grid-cols-5 to make room for the extra column */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          
          {/* Left Side: Brand and Description (Spans 3 columns) */}
          <div className="md:col-span-3">
            <Link href="/" className="flex items-center gap-3 group mb-6 w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 border border-primary/30 group-hover:border-primary/60 transition-colors">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <span className="font-serif-display font-bold text-lg tracking-tight text-foreground">
                BKK Accessibility
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              A University Case Study open-data research project mapping wheelchair accessibility across Budapest's public transport network using GTFS feeds from BKK.
            </p>
          </div>

          {/* Right Side Column 1: Navigation Links (Spans 1 column) */}
          <div className="md:col-span-1">
            <div className="label-eyebrow mb-5 text-foreground">Project</div>
            <ul className="space-y-4 text-sm text-muted-foreground font-medium">
              <li>
                <a 
                  href="https://github.com/mapi-developer/AdvancedProgrammingBKK" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-primary transition-colors"
                >
                  Source code
                </a>
              </li>
              <li>
                <Link href="#methodology" className="hover:text-primary transition-colors">
                  Methodology
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-primary transition-colors">
                  Live Map
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Side Column 2: Data & API Docs (Spans 1 column) */}
          <div className="md:col-span-1">
            <div className="label-eyebrow mb-5 text-foreground">Data & API</div>
            <ul className="space-y-4 text-sm text-muted-foreground font-medium">
              <li>
                <a 
                  href="http://localhost:8000/docs" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-primary transition-colors"
                >
                  FastAPI Swagger
                </a>
              </li>
              <li>
                <a 
                  href="https://opendata.bkk.hu/data-sources" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-primary transition-colors"
                >
                  BKK GTFS Feeds
                </a>
              </li>
              <li>
                <a 
                  href="https://opendata.bkk.hu/data-sources" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-primary transition-colors"
                >
                  FUTÁR API Docs
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Section: Copyright & Tags */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-border/100 text-[10px] font-mono uppercase tracking-widest text-muted-foreground gap-4">
          <div>© 2026 Advanced Programming Course | Corvinus University of Budapeset</div>
          <div>Designed by Pisarev Matvei</div>
        </div>
        
      </div>
    </footer>
  );
};