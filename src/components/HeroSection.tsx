import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-world-travel.jpg';

// Inject preload hint as early as possible (module-eval time)
if (typeof document !== 'undefined' && !document.querySelector('link[data-hero-preload]')) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = heroImage;
  link.setAttribute('data-hero-preload', 'true');
  // @ts-ignore
  link.fetchPriority = 'high';
  document.head.appendChild(link);
}

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden hero-depth-container">
      {/* Background — deepest layer */}
      <div className="absolute inset-0 hero-depth-bg">
        <img
          src={heroImage}
          alt="World Travel and Cultural Heritage Sites"
          width={1200}
          height={675}
          className="w-full h-full object-cover opacity-60"
          loading="eager"
          // @ts-ignore - fetchpriority is valid HTML
          fetchpriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/60" />
      </div>

      {/* Headphone silhouette background decoration — mid layer */}
      <div className="audio-hero-silhouette hero-depth-mid" />

      {/* Decorative sound wave lines — mid layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hero-depth-mid">
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/8 to-transparent" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/6 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto mobile-container hero-depth-front">
        <div className="mobile-spacing">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full audio-premium-badge">
            <Headphones className="h-4 w-4 text-primary" />
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
            <Button variant="hero" size="default" className="w-full sm:w-auto px-6 py-3 btn-raised" onClick={() => navigate('/country')}>
              <Headphones className="h-4 w-4 mr-2" />
              Explore Destinations
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
