import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Headphones, Sparkles } from 'lucide-react';
import heroImage from '@/assets/hero-audio-guide.jpg';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="AI Audio Guide Interface"
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
            <span className="text-sm font-medium">AI-Powered Audio Experiences</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
              Intelligent Audio Guides
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience immersive, AI-generated audio tours that adapt to your interests and pace. 
              Discover stories like never before.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="hero" 
              size="lg" 
              className="px-8 py-4 text-lg h-auto"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Your Journey
            </Button>
            <Button 
              variant="glass" 
              size="lg" 
              className="px-8 py-4 text-lg h-auto"
            >
              <Headphones className="h-5 w-5 mr-2" />
              Browse Guides
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {[
              {
                icon: "🤖",
                title: "AI-Generated Content",
                description: "Dynamic narration that adapts to your preferences"
              },
              {
                icon: "🌍",
                title: "Global Destinations",
                description: "Explore museums, cities, and landmarks worldwide"
              },
              {
                icon: "📱",
                title: "Mobile Optimized",
                description: "Seamless experience on any device, anywhere"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center space-y-3 p-6 rounded-xl bg-card/10 backdrop-blur-sm border border-border/30">
                <div className="text-4xl">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
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