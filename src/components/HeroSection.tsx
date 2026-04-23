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
    <section className="relative flex min-h-[62vh] items-end justify-center overflow-hidden px-mobile-padding pt-4 md:min-h-[68vh] hero-depth-container">
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
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background/85" />
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
      <div className="relative z-10 mx-auto w-full max-w-5xl pb-6 hero-depth-front">
        <div className="discover-hero-panel mobile-spacing">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-extrabold leading-[0.98] text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              Discover places through a richer audio travel experience
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-foreground/78 sm:text-base md:text-lg">
              Explore UNESCO landmarks, cultural routes and iconic destinations with premium storytelling, fast mobile discovery and a listening flow designed to feel effortless.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center">
            <Button variant="hero" size="lg" className="w-full sm:w-auto px-6" onClick={() => navigate('/country')}>
              <Headphones className="h-4 w-4" />
              Explore Destinations
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-6" onClick={() => navigate('/guides')}>
              Browse Audio Guides
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
