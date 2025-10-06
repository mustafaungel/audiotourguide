import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, Search, MapPin } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="mobile-viewport bg-background">
      <SEO 
        title="Page Not Found | 404 Error"
        description="The page you're looking for doesn't exist. Browse our audio tour guides for UNESCO World Heritage sites and cultural landmarks worldwide."
        noindex={true}
      />
      <Navigation />
      
      <section className="mobile-padding mobile-spacing min-h-[60vh] flex items-center justify-center">
        <div className="mobile-container max-w-2xl text-center">
          <div className="text-8xl mb-6">🧭</div>
          
          <h1 className="mobile-heading sm:text-3xl lg:text-4xl text-foreground mb-4">
            Lost in the Digital Wilderness
          </h1>
          
          <p className="mobile-text text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track!
          </p>

          <div className="mobile-stack sm:flex-row gap-4 justify-center">
            <Button
              variant="default"
              size="lg"
              className="mobile-button px-8 py-4 touch-target"
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="mobile-button px-8 py-4 touch-target"
              onClick={() => navigate('/guides')}
            >
              <Search className="h-4 w-4 mr-2" />
              Browse All Guides
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="mobile-button px-8 py-4 touch-target"
              onClick={() => navigate('/country')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Explore by Country
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="mobile-caption mb-4">Popular destinations:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['UNESCO Sites', 'Museums', 'Historical Cities', 'Cultural Heritage'].map((tag) => (
                <span 
                  key={tag}
                  className="px-3 py-1 rounded-full bg-card/50 border border-border text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NotFound;
