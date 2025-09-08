import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '@/components/HeroSection';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GuideCard } from '@/components/GuideCard';
import { Navigation } from '@/components/Navigation';

import { CreatorRecommendations } from '@/components/CreatorRecommendations';
import { Button } from '@/components/ui/button';
import { Headphones } from 'lucide-react';

import { EnhancedGuideCard } from '@/components/EnhancedGuideCard';

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
  const navigate = useNavigate();
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
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
    // Navigate directly to guide detail page for purchase (supports guest checkout)
    navigate(`/guide/${guideId}`);
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
    <div className="mobile-viewport bg-background">
      <Navigation />
      <HeroSection />
      
      
      {/* Mobile-Optimized Featured Destinations Section */}
      <section className="mobile-padding mobile-spacing">{/* Mobile-first section */}
        <div className="mobile-container">
          {/* Section Header */}
          <div className="text-center mobile-spacing">
            <div className="inline-flex items-center gap-2 mobile-padding rounded-full bg-card/20 backdrop-blur-md border border-border/50 mb-4">
              <Headphones className="h-4 w-4 text-primary" />
              <span className="mobile-caption font-medium">Featured Destinations</span>
            </div>
            <h2 className="mobile-heading sm:text-3xl lg:text-4xl text-foreground mb-3">
              Iconic Destinations Await
            </h2>
            <p className="mobile-text sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore UNESCO World Heritage sites, cultural treasures, and iconic landmarks with immersive AI-guided tours
            </p>
          </div>

          {/* Search Results Info */}
          {searchTerm && (
            <div className="text-center mb-6">
              <p className="mobile-caption">
                {loading ? 'Searching...' : `Found ${filteredGuides.length} result(s) for "${searchTerm}"`}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="mobile-card animate-pulse">
                  <div className="aspect-[16/9] sm:aspect-[4/3] bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          )}

          {/* Guides Grid */}
          {!loading && (
            <div className="grid gap-4 sm:gap-6">
              {filteredGuides.map((guide) => {
                const isPurchased = userPurchases.includes(guide.id);
                
                return (
                  <div key={guide.id} className="w-full">
                    <EnhancedGuideCard
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
                      creatorName="AI Guide Creator"
                      isPurchased={isPurchased}
                      isProcessingPayment={processingPayment === guide.id}
                      onViewGuide={() => {
                        if (isPurchased || guide.price_usd === 0) {
                          handlePlayGuide(guide);
                        } else {
                          // Navigate to guide detail page for purchase
                          navigate(`/guide/${guide.id}`);
                        }
                      }}
                      onPreview={() => {
                        // Preview functionality - play first 30 seconds
                        console.log('Playing preview for guide:', guide.id);
                      }}
                     />
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredGuides.length === 0 && (
            <div className="text-center py-16 mobile-spacing">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="mobile-subheading text-foreground mb-2">No destinations found</h3>
              <p className="mobile-caption">Try searching for UNESCO sites, cultural experiences, or specific countries</p>
            </div>
          )}
        </div>
      </section>


      {/* Audio Player Section */}
      {selectedGuide && (
        <section className="mobile-padding mobile-spacing">
          <div className="mobile-container max-w-2xl">
            <div className="text-center mobile-spacing">
              <h2 className="mobile-heading text-foreground mb-2">Now Playing</h2>
              <p className="mobile-caption">Immerse yourself in the audio experience</p>
            </div>
            <AudioPlayer 
              title={selectedGuide.title}
              description={selectedGuide.description}
              guideId={selectedGuide.id}
              transcript={selectedGuide.transcript}
            />
          </div>
        </section>
      )}


      {/* CTA Section */}
      <section className="mobile-padding mobile-spacing bg-gradient-hero">
        <div className="mobile-container max-w-4xl text-center">
          <h2 className="mobile-heading sm:text-3xl lg:text-4xl text-foreground mb-4">
            Ready to Discover the World?
          </h2>
          <p className="mobile-text sm:text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of travelers exploring UNESCO World Heritage sites and cultural treasures with AI-powered storytelling
          </p>
          <div className="mobile-stack sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="lg" 
              className="mobile-button px-8 py-4 touch-target"
              onClick={() => navigate('/search')}
            >
              Start Exploring
            </Button>
            <Button 
              variant="glass" 
              size="lg" 
              className="mobile-button px-8 py-4 touch-target"
              onClick={() => navigate('/category/destinations')}
            >
              View All Destinations
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
