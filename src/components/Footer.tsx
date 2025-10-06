import { Link } from "react-router-dom";
import { MapPin, Headphones, Globe } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Headphones className="h-4 w-4" />
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
              <Globe className="h-4 w-4" />
              Popular Destinations
            </h3>
            <nav className="flex flex-col gap-2">
              <Link to="/country/peru" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Peru
              </Link>
              <Link to="/country/italy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Italy
              </Link>
              <Link to="/country/japan" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Japan
              </Link>
              <Link to="/country/greece" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Greece
              </Link>
            </nav>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              About
            </h3>
            <p className="text-sm text-muted-foreground">
              Explore the world's cultural heritage and UNESCO World Heritage sites with our premium audio guides.
            </p>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Audio Tour Guides. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
