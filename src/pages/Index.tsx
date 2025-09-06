import React, { useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GuideCard } from '@/components/GuideCard';
import { Button } from '@/components/ui/button';
import { Headphones, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import guideColosseum from '@/assets/guide-colosseum.jpg';
import guideMuseum from '@/assets/guide-museum.jpg';
import guideNature from '@/assets/guide-nature.jpg';

const Index = () => {
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const guides = [
    {
      id: 1,
      title: "Ancient Rome: Colosseum Chronicles",
      description: "Journey through 2,000 years of gladiatorial history with immersive AI narration that brings the ancient amphitheater to life.",
      duration: "45 min",
      location: "Rome, Italy",
      rating: 4.9,
      category: "History",
      imageUrl: guideColosseum,
    },
    {
      id: 2,
      title: "Modern Art Masterpieces",
      description: "Explore contemporary sculptures and installations with expert insights powered by AI analysis of artistic movements.",
      duration: "30 min",
      location: "MoMA, New York",
      rating: 4.8,
      category: "Art",
      imageUrl: guideMuseum,
    },
    {
      id: 3,
      title: "Mountain Trail Adventures",
      description: "Discover local flora, fauna, and geological formations on this scenic hiking path with real-time nature identification.",
      duration: "60 min",
      location: "Alpine National Park",
      rating: 4.7,
      category: "Nature",
      imageUrl: guideNature,
    },
  ];

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayGuide = (guide: any) => {
    setSelectedGuide(guide);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Audio Player Section */}
      {selectedGuide && (
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Now Playing</h2>
              <p className="text-muted-foreground">Immerse yourself in the audio experience</p>
            </div>
            <AudioPlayer 
              title={selectedGuide.title}
              description={selectedGuide.description}
            />
          </div>
        </section>
      )}

      {/* Featured Guides Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/20 backdrop-blur-md border border-border/50 mb-6">
              <Headphones className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Featured Audio Guides</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Discover Amazing Stories
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered audio guides that transform how you explore the world around you
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guides, locations, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card/50 backdrop-blur-sm border-border/50"
              />
            </div>
            <Button variant="outline" className="md:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGuides.map((guide) => (
              <GuideCard
                key={guide.id}
                title={guide.title}
                description={guide.description}
                duration={guide.duration}
                location={guide.location}
                rating={guide.rating}
                category={guide.category}
                imageUrl={guide.imageUrl}
                onPlay={() => handlePlayGuide(guide)}
              />
            ))}
          </div>

          {/* No Results */}
          {filteredGuides.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No guides found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to Explore?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of explorers who have discovered the magic of AI-powered audio guides
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="px-8 py-4 text-lg h-auto">
              Get Started Free
            </Button>
            <Button variant="glass" size="lg" className="px-8 py-4 text-lg h-auto">
              Browse All Guides
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
