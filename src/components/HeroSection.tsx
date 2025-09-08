import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Headphones, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-world-travel.jpg';
export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  return <section className="relative mobile-viewport flex items-center justify-center overflow-hidden">{/* Mobile-first viewport */}
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="World Travel and Cultural Heritage Sites" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-hero" />
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
            <h1 className="text-mobile-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
              Explore the World's Hidden Stories
            </h1>
            <p className="mobile-text sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Discover UNESCO World Heritage sites, cultural traditions, and iconic destinations with AI-powered audio tours that bring history to life.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-mobile-padding sm:gap-4 justify-center items-center w-full max-w-sm mx-auto sm:max-w-none sm:flex-row">
            <Button variant="hero" size="lg" className="mobile-button w-full sm:w-auto px-8 py-4 text-mobile-lg touch-target" onClick={() => navigate('/search')}>
              <Play className="h-5 w-5 mr-3" />
              Explore Destinations
            </Button>
            <Button variant="glass" size="lg" className="mobile-button w-full sm:w-auto px-8 py-4 text-mobile-lg touch-target" onClick={() => navigate('/unesco-sites')}>
              <Headphones className="h-5 w-5 mr-3" />
              World Heritage Sites
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