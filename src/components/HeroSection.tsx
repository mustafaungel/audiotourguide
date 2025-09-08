import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchModal } from './SearchModal';
import { Search } from 'lucide-react';
import heroImage from '@/assets/hero-world-travel.jpg';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-hero overflow-hidden">{/* Reduced height */}
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="World Travel and Cultural Heritage Sites"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Search-First Content */}
      <div className="relative max-w-6xl mx-auto mobile-container">
        <div className="text-center mobile-spacing">
          {/* Compact Badge */}
          <div className="inline-flex items-center gap-2 mobile-padding rounded-full bg-card/20 backdrop-blur-md border border-border/50 mb-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="mobile-caption font-medium text-foreground">AI-Powered Cultural Exploration</span>
          </div>

          {/* Compact Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4 max-w-4xl mx-auto">
            Explore the World's <span className="bg-gradient-text bg-clip-text text-transparent">Heritage</span>
          </h1>

          {/* Compact Description */}
          <p className="mobile-text sm:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            AI-generated audio tours for UNESCO sites and cultural treasures
          </p>

          {/* Large Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <SearchModal>
              <Button 
                variant="outline" 
                className="w-full h-14 text-left justify-start bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300"
              >
                <Search className="h-5 w-5 mr-3 text-muted-foreground" />
                <span className="text-muted-foreground text-lg">Where do you want to explore?</span>
              </Button>
            </SearchModal>
          </div>

          {/* Popular Destination Chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[
              { name: "Paris", path: "/search?location=Paris" },
              { name: "Istanbul", path: "/search?location=Istanbul" },
              { name: "Kyoto", path: "/search?location=Kyoto" },
              { name: "UNESCO Sites", path: "/unesco-sites" }
            ].map((destination) => (
              <Button
                key={destination.name}
                variant="secondary"
                size="sm"
                className="rounded-full hover:scale-105 transition-all duration-200"
                onClick={() => navigate(destination.path)}
              >
                {destination.name}
              </Button>
            ))}
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { name: "Cultural", icon: "🎭", path: "/category/cultural" },
              { name: "Historical", icon: "🏛️", path: "/category/historical" },
              { name: "Adventure", icon: "🏔️", path: "/category/adventure" },
              { name: "Food & Culture", icon: "🍜", path: "/category/food" }
            ].map((category) => (
              <Button
                key={category.name}
                variant="ghost"
                size="sm"
                className="rounded-full hover:bg-card/50 transition-all duration-200 gap-2"
                onClick={() => navigate(category.path)}
              >
                <span>{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Interactive Features */}
        <div className="mobile-grid gap-mobile-padding mt-8 sm:mt-16 max-w-4xl mx-auto">
          {[
            {
              icon: "🏛️",
              title: "UNESCO World Heritage",
              description: "Explore ancient sites and cultural treasures with expert narration",
              path: "/unesco-sites"
            },
            {
              icon: "🎭",
              title: "Cultural Experiences",
              description: "Immerse in local traditions, art, and centuries-old customs",
              path: "/category/cultural"
            },
            {
              icon: "🗺️",
              title: "Hidden Stories",
              description: "Uncover secrets and legends behind iconic landmarks",
              path: "/category/historical"
            }
          ].map((feature, index) => (
            <div 
              key={index} 
              className="mobile-card text-center mobile-spacing hover:bg-card/25 hover:scale-105 transition-all duration-300 backdrop-blur-sm cursor-pointer group touch-target"
              onClick={() => navigate(feature.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(feature.path);
                }
              }}
            >
              <div className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-200">
                {feature.icon}
              </div>
              <h3 className="mobile-subheading text-foreground group-hover:text-primary transition-colors duration-200">
                {feature.title}
              </h3>
              <p className="mobile-caption group-hover:text-foreground transition-colors duration-200">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
    </section>
  );
};