import React, { useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GuideCard } from '@/components/GuideCard';
import { Button } from '@/components/ui/button';
import { Headphones, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import cappadociaImage from '@/assets/cappadocia-goreme.jpg';
import istanbulImage from '@/assets/istanbul-hagia-sophia.jpg';
import machupichuImage from '@/assets/machu-picchu.jpg';
import kyotoImage from '@/assets/kyoto-temple.jpg';
import parisImage from '@/assets/paris-louvre.jpg';
import santoriniImage from '@/assets/santorini-greece.jpg';

const Index = () => {
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const guides = [
    {
      id: 1,
      title: "Cappadocia: Göreme Open Air Museum",
      description: "Soar above ancient cave churches and fairy chimneys while learning about Byzantine history and Cappadocia's unique geology from local storytellers.",
      duration: "50 min",
      location: "Cappadocia, Turkey",
      rating: 4.9,
      category: "UNESCO Heritage",
      imageUrl: cappadociaImage,
    },
    {
      id: 2,
      title: "Istanbul: Whirling Dervish & Hagia Sophia",
      description: "Experience the mystical Sufi traditions and explore the architectural marvel that bridges Europe and Asia, with stories spanning Byzantine and Ottoman empires.",
      duration: "65 min",
      location: "Istanbul, Turkey",
      rating: 4.8,
      category: "Cultural Heritage",
      imageUrl: istanbulImage,
    },
    {
      id: 3,
      title: "Machu Picchu: Lost City of the Incas",
      description: "Uncover the mysteries of this ancient Inca citadel perched high in the Andes, with indigenous wisdom and archaeological discoveries.",
      duration: "75 min",
      location: "Cusco, Peru",
      rating: 4.9,
      category: "Archaeological Site",
      imageUrl: machupichuImage,
    },
    {
      id: 4,
      title: "Kyoto: Temples & Bamboo Forests",
      description: "Journey through Japan's cultural heart, discovering Zen philosophy, traditional arts, and the serene beauty of ancient temples.",
      duration: "55 min",
      location: "Kyoto, Japan",
      rating: 4.7,
      category: "Cultural Heritage",
      imageUrl: kyotoImage,
    },
    {
      id: 5,
      title: "Paris: Louvre & Artistic Treasures",
      description: "Navigate the world's largest art museum with expert insights into masterpieces from da Vinci to Napoleon's collections.",
      duration: "45 min",
      location: "Paris, France",
      rating: 4.8,
      category: "Art & Museums",
      imageUrl: parisImage,
    },
    {
      id: 6,
      title: "Santorini: Aegean Island Paradise",
      description: "Explore the volcanic island's iconic blue-domed churches, ancient Minoan ruins, and traditional Greek island culture.",
      duration: "40 min",
      location: "Santorini, Greece",
      rating: 4.6,
      category: "Island Heritage",
      imageUrl: santoriniImage,
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
              <span className="text-sm font-medium">Featured Destinations</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Iconic Destinations Await
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore UNESCO World Heritage sites, cultural treasures, and iconic landmarks with immersive AI-guided tours
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search destinations, UNESCO sites, or cultural experiences..."
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
              <h3 className="text-xl font-semibold text-foreground mb-2">No destinations found</h3>
              <p className="text-muted-foreground">Try searching for UNESCO sites, cultural experiences, or specific countries</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to Discover the World?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of travelers exploring UNESCO World Heritage sites and cultural treasures with AI-powered storytelling
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="px-8 py-4 text-lg h-auto">
              Start Exploring
            </Button>
            <Button variant="glass" size="lg" className="px-8 py-4 text-lg h-auto">
              View All Destinations
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
