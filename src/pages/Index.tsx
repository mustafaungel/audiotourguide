import React, { useState, useEffect } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GuideCard } from '@/components/GuideCard';
import { Navigation } from '@/components/Navigation';
import { ViralDashboard } from '@/components/ViralDashboard';
import { Button } from '@/components/ui/button';
import { Headphones, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import cappadociaImage from '@/assets/cappadocia-goreme.jpg';
import istanbulImage from '@/assets/istanbul-hagia-sophia.jpg';
import machupichuImage from '@/assets/machu-picchu.jpg';
import kyotoImage from '@/assets/kyoto-temple.jpg';
import parisImage from '@/assets/paris-louvre.jpg';
import santoriniImage from '@/assets/santorini-greece.jpg';

const Index = () => {
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchGuides();
    if (user) {
      fetchUserPurchases();
    }
  }, [user]);

  const fetchGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('is_published', true)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setGuides(data || []);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast({
        title: "Error",
        description: "Failed to load guides",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPurchases = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('guide_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setUserPurchases(data?.map(p => p.guide_id) || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const handlePurchaseGuide = async (guideId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase guides",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { guideId },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    }
  };

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayGuide = async (guide: any) => {
    setSelectedGuide(guide);
    
    // Track guide view for viral metrics
    try {
      await supabase.functions.invoke('track-viral-engagement', {
        body: {
          action: 'view',
          guide_id: guide.id
        }
      });
    } catch (error) {
      console.error('Error tracking guide view:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      
      {/* Viral Dashboard Section */}
      <ViralDashboard />

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

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                  <div className="h-48 bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          )}

          {/* Guides Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGuides.map((guide) => {
                const isPurchased = userPurchases.includes(guide.id);
                const formattedPrice = guide.price_usd === 0 ? "Free" : `$${guide.price_usd}`;
                const formattedDuration = `${Math.floor(guide.duration / 60)} min`;
                
                return (
                  <GuideCard
                    key={guide.id}
                    id={guide.id}
                    title={guide.title}
                    description={guide.description}
                    duration={guide.duration}
                    location={guide.location}
                    rating={guide.rating || 0}
                    category={guide.category}
                    price={guide.price_usd}
                    difficulty={guide.difficulty}
                    imageUrl={guide.image_url}
                    totalPurchases={guide.total_purchases || 0}
                    creatorName="Guide Creator"
                    onViewGuide={() => {
                      if (isPurchased || guide.price_usd === 0) {
                        handlePlayGuide(guide);
                      } else {
                        handlePurchaseGuide(guide.id);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredGuides.length === 0 && (
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
