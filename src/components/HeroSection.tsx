import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Headphones, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-world-travel.jpg';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="World Travel and Cultural Heritage Sites"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/20 backdrop-blur-md border border-border/50">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Discover World Heritage & Culture</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
              Explore the World's Hidden Stories
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover UNESCO World Heritage sites, cultural traditions, and iconic destinations with AI-powered audio tours that bring history to life.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center w-full max-w-sm mx-auto sm:max-w-none sm:flex-row">
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full sm:w-auto px-8 py-4 text-lg h-auto min-h-[48px] touch-manipulation"
              onClick={() => navigate('/search')}
            >
              <Play className="h-5 w-5 mr-3" />
              Explore Destinations
            </Button>
            <Button 
              variant="glass" 
              size="lg" 
              className="w-full sm:w-auto px-8 py-4 text-lg h-auto min-h-[48px] touch-manipulation"
              onClick={() => navigate('/unesco-sites')}
            >
              <Headphones className="h-5 w-5 mr-3" />
              World Heritage Sites
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-8 sm:mt-16 md:grid-cols-3">
            {[
              {
                icon: "🏛️",
                title: "UNESCO World Heritage",
                description: "Explore ancient sites and cultural treasures with expert narration"
              },
              {
                icon: "🎭",
                title: "Cultural Experiences",
                description: "Immerse in local traditions, art, and centuries-old customs"
              },
              {
                icon: "🗺️",
                title: "Hidden Stories",
                description: "Uncover secrets and legends behind iconic landmarks"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center space-y-3 sm:space-y-4 p-6 sm:p-8 rounded-xl bg-card/10 backdrop-blur-sm border border-border/30 hover:bg-card/15 transition-all duration-300">
                <div className="text-4xl sm:text-5xl">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
    </section>
  );
};