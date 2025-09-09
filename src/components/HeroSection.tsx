import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Headphones, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-world-travel.jpg';
export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  return <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">{/* Optimized viewport */}
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="World Travel and Cultural Heritage Sites" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto mobile-container">
        <div className="mobile-spacing">{/* Mobile-first spacing */}
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/20 backdrop-blur-md border border-border/50">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Discover World Heritage & Culture</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
              Explore the World's Hidden Stories
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover UNESCO World Heritage sites, cultural traditions, and iconic destinations with high quality audio guides that bring history to life.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-mobile-padding sm:gap-4 justify-center items-center w-full max-w-sm mx-auto sm:max-w-none sm:flex-row">
            <Button variant="hero" size="default" className="w-full sm:w-auto px-6 py-3" onClick={() => navigate('/country')}>
              <Play className="h-4 w-4 mr-2" />
              Explore Destinations
            </Button>
          </div>

          {/* Features */}
          
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-pulse" style={{
      animationDelay: '1s'
    }} />
    </section>;
};