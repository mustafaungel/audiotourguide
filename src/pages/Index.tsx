import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { HeroSection } from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GuideCard } from '@/components/GuideCard';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Headphones, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import * as CarouselComponents from '@/components/ui/carousel';
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
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchGuides();
    if (user) {
      fetchUserPurchases();
    }
  }, [user]);
  const fetchGuides = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('audio_guides').select('*').eq('is_published', true).eq('is_approved', true).eq('is_standalone', true).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setGuides(data || []);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast({
        title: "Error",
        description: "Failed to load guides",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchUserPurchases = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('user_purchases').select('guide_id').eq('user_id', user.id);
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
        variant: "destructive"
      });
      return;
    }
    if (processingPayment === guideId) {
      return; // Prevent multiple clicks
    }
    setProcessingPayment(guideId);
    try {
      console.log('Starting payment process for guide:', guideId);
      const {
        data,
        error
      } = await supabase.functions.invoke('create-payment', {
        body: {
          guideId
        }
      });
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      if (!data?.url) {
        throw new Error('No payment URL received');
      }
      console.log('Payment URL received, opening checkout:', data.url);

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      toast({
        title: "Payment Started",
        description: "Redirecting to secure checkout..."
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Clear processing state after a short delay
      setTimeout(() => {
        setProcessingPayment(null);
      }, 2000);
    }
  };
  const filteredGuides = guides.filter(guide => guide.title.toLowerCase().includes(searchTerm.toLowerCase()) || guide.category.toLowerCase().includes(searchTerm.toLowerCase()) || guide.location.toLowerCase().includes(searchTerm.toLowerCase()));
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
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Audio Tour Guides",
    "description": "Discover UNESCO World Heritage sites with immersive audio guides",
    "url": "https://guided-sound-ai.lovable.app",
    "logo": "https://guided-sound-ai.lovable.app/logo-audio-tour-guides.png"
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://guided-sound-ai.lovable.app",
    "name": "Audio Tour Guides",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://guided-sound-ai.lovable.app/guides?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return <div className="mobile-viewport bg-background">
      <SEO 
        title="Audio Tour Guides | UNESCO World Heritage Sites & Cultural Landmarks"
        description="Discover 50+ professional audio tour guides for UNESCO World Heritage sites, museums, and iconic destinations worldwide. Immersive storytelling in multiple languages with offline access and expert narration."
        canonicalUrl="https://guided-sound-ai.lovable.app"
        structuredData={[websiteSchema, organizationSchema]}
      />
      <Navigation />
      <HeroSection />
      <StatsSection />
      
      {/* Mobile-Optimized Featured Destinations Section */}
      <section className="mobile-padding mobile-spacing">{/* Mobile-first section */}
        <div className="mobile-container">
          {/* Section Header */}
          <div className="text-center mobile-spacing">
            <div className="inline-flex items-center gap-2 mobile-padding rounded-full bg-card/20 backdrop-blur-md border border-border/50 mb-4">
              <Headphones className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Audio Guides</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4">Explore Audio Guides</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Browse our collection of premium audio guides for world heritage sites and cultural destinations
            </p>
          </div>

          {/* Enhanced Search and Filter */}
          <div className="mobile-stack max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search destinations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-card/50 backdrop-blur-sm border-border/50 touch-target mobile-text" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 sm:flex-none touch-target">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              {searchTerm && <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="text-muted-foreground hover:text-foreground touch-target px-4">
                  Clear
                </Button>}
            </div>
          </div>

          {/* Search Results Info */}
          {searchTerm && <div className="text-center mb-6">
              <p className="mobile-caption">
                {loading ? 'Searching...' : `Found ${filteredGuides.length} result(s) for "${searchTerm}"`}
              </p>
            </div>}

          {/* Loading State */}
          {loading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="mobile-card animate-pulse">
                  <div className="aspect-mobile bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>)}
            </div>}

          {/* Guides Grid */}
          {!loading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGuides.map(guide => {
            const isPurchased = userPurchases.includes(guide.id);
            const formattedPrice = guide.price_usd === 0 ? "Free" : `$${(guide.price_usd / 100).toFixed(2)}`;
            const formattedDuration = `${Math.floor(guide.duration / 60)} min`;
            return <GuideCard key={guide.id} id={guide.id} slug={guide.slug} title={guide.title} description={guide.description} duration={guide.duration} location={guide.location} rating={guide.rating || 0} category={guide.category} price={guide.price_usd} difficulty={guide.difficulty} imageUrl={guide.image_urls?.[0] || guide.image_url} totalPurchases={guide.total_purchases || 0} creatorName="Guide Creator" isProcessingPayment={processingPayment === guide.id} onViewGuide={() => {
              if (isPurchased || guide.price_usd === 0) {
                handlePlayGuide(guide);
              } else {
                handlePurchaseGuide(guide.id);
              }
            }} />;
          })}
            </div>}

          {/* No Results */}
          {!loading && filteredGuides.length === 0 && <div className="text-center py-16 mobile-spacing">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="mobile-subheading text-foreground mb-2">No destinations found</h2>
              <p className="mobile-caption">Try searching for UNESCO sites, cultural experiences, or specific countries</p>
            </div>}
        </div>
      </section>


      {/* Audio Player Section */}
      {selectedGuide && <section className="mobile-padding mobile-spacing">
          <div className="mobile-container max-w-2xl">
            <div className="text-center mobile-spacing">
              <h2 className="mobile-heading text-foreground mb-2">Now Playing</h2>
              <p className="mobile-caption">Immerse yourself in the audio experience</p>
            </div>
            <AudioPlayer title={selectedGuide.title} description={selectedGuide.description} guideId={selectedGuide.id} transcript={selectedGuide.transcript} />
          </div>
        </section>}


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
            <Button variant="hero" size="lg" className="mobile-button px-8 py-4 touch-target" onClick={() => navigate('/country')}>
              Start Exploring
            </Button>
          </div>
        </div>
       </section>
       <Footer />
    </div>;
};
export default Index;