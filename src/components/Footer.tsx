import { Link } from "react-router-dom";
import { MapPin, Headphones, Globe } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-16 audio-wave-decoration">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              Quick Links
            </h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/guides" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Audio Guides
              </Link>
              <Link to="/country" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Destinations
              </Link>
            </nav>
          </div>

          {/* Popular Destinations */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Popular Destinations
            </h3>
            <nav className="flex flex-col gap-2">
              <Link to="/country/turkey" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Turkey
              </Link>
            </nav>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              About
            </h3>
            <p className="text-sm text-muted-foreground">
              Explore the world's cultural heritage and UNESCO World Heritage sites with our premium audio guides.
            </p>
          </div>
        </div>

        <div className="border-t border-border/30 mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
            <Headphones className="h-3.5 w-3.5" />
            © {new Date().getFullYear()} Audio Tour Guides. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
