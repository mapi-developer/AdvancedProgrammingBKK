import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

export const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-[2000] w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-6 mx-auto">
        
        {/* Left Side: Logo & Brand Title */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 border border-primary/30 group-hover:border-primary/60 transition-colors">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <span className="font-serif-display font-bold text-lg tracking-tight text-foreground">
            BKK Accessibility
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#project" className="hover:text-foreground transition-colors">
            Project
          </Link>
          <Link href="#research" className="hover:text-foreground transition-colors">
            Research
          </Link>
          <Link href="#methodology" className="hover:text-foreground transition-colors">
            Methodology
          </Link>
          <Link href="/map" className="hover:text-foreground transition-colors">
            Live Map
          </Link>
        </nav>
        
        {/* Right Side: Action Button */}
        <div className="flex items-center">
          <Link href="/map">
            <button className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity shadow-glow flex items-center gap-2">
              Open Live map
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>

      </div>
    </header>
  );
};