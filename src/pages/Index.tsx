import React, { useState, useEffect, useMemo } from 'react';
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { HeroSection } from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GuideCard } from '@/components/GuideCard';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Headphones, MapPin } from 'lucide-react';
import * as CarouselComponents from '@/components/ui/carousel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
const Index = () => {
  const navigate = useNavigate();
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState(6);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: guides = [], isLoading: loading } = useQuery({
    queryKey: ['homepage-guides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('id, title, slug, description, duration, location, rating, category, price_usd, difficulty, image_urls, image_url, total_purchases, display_order, is_featured, languages')
        .eq('is_published', true)
        .eq('is_approved', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: userPurchases = [] } = useQuery({
    queryKey: ['user-purchases', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('guide_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data?.map(p => p.guide_id) || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
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
  
  const handlePlayGuide = (guide: any) => {
    setSelectedGuide(guide);
    supabase.functions.invoke('track-viral-engagement', {
      body: { action: 'view', guide_id: guide.id }
    }).catch(err => console.error('Error tracking guide view:', err));
  };
  // Extract countries and cities from guide locations
  const countries = useMemo(() => {
    const set = new Set<string>();
    guides.forEach(g => {
      const parts = g.location?.split(',');
      if (parts?.length >= 2) set.add(parts[parts.length - 1].trim());
    });
    return Array.from(set).sort();
  }, [guides]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    guides.forEach(g => {
      const parts = g.location?.split(',');
      if (parts?.length >= 2) {
        const country = parts[parts.length - 1].trim();
        if (!selectedCountry || country === selectedCountry) {
          set.add(parts[0].trim());
        }
      }
    });
    return Array.from(set).sort();
  }, [guides, selectedCountry]);

  const filteredGuides = useMemo(() => {
    return guides.filter(g => {
      const parts = g.location?.split(',');
      const guideCity = parts?.[0]?.trim() || '';
      const guideCountry = parts?.[parts.length - 1]?.trim() || '';
      if (selectedCountry && guideCountry !== selectedCountry) return false;
      if (selectedCity && guideCity !== selectedCity) return false;
      return true;
    });
  }, [guides, selectedCountry, selectedCity]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(6);
  }, [selectedCountry, selectedCity]);

  const visibleGuides = filteredGuides.slice(0, visibleCount);
  const remainingCount = filteredGuides.length - visibleCount;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Audio Tour Guides",
    "description": "Discover UNESCO World Heritage sites with immersive audio guides",
    "url": "https://audiotourguide.app",
    "logo": "https://audiotourguide.app/logo-audio-tour-guides.png"
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://audiotourguide.app",
    "name": "Audio Tour Guides",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://audiotourguide.app/guides?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return <div className="mobile-viewport bg-background">
      <SEO 
        title="Audio Tour Guides | World Heritage & Cultural Sites"
        description="Discover professional audio tour guides for UNESCO sites, museums, and iconic destinations. Multi-language storytelling with expert narration."
        canonicalUrl="https://audiotourguide.app"
        structuredData={[websiteSchema, organizationSchema]}
      />
      <Navigation />
      <HeroSection />
      <StatsSection />
      
      {/* Country/City Filter + Guides Section */}
      <section className="mobile-padding mobile-spacing">
        <div className="mobile-container">
          {/* Destination Filter Chips */}
          {!loading && guides.length > 0 && countries.length > 0 && (
            <div className="mb-5 space-y-3">
              {/* Country chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => { setSelectedCountry(''); setSelectedCity(''); }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                    !selectedCountry
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" /> All
                </button>
                {countries.map(c => {
                  const count = guides.filter(g => g.location?.includes(c)).length;
                  return (
                    <button
                      key={c}
                      onClick={() => { setSelectedCountry(c); setSelectedCity(''); }}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                        selectedCountry === c
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-card border-border text-foreground hover:bg-muted hover:shadow-sm'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" /> {c}
                      <span className="text-xs opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
              {/* City chips (shown when country selected) */}
              {selectedCountry && cities.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setSelectedCity('')}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                      !selectedCity
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-card border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    All Cities
                  </button>
                  {cities.map(c => {
                    const count = guides.filter(g => g.location?.startsWith(c)).length;
                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedCity(c)}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                          selectedCity === c
                            ? 'bg-primary/15 text-primary border-primary/30'
                            : 'bg-card border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {c} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && <AudioGuideLoader variant="card" count={6} />}

          {/* Guides List */}
          {!loading && filteredGuides.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {visibleGuides.map((guide, idx) => (
                <GuideCard
                  key={guide.id}
                  id={guide.id}
                  slug={guide.slug}
                  title={guide.title}
                  description={guide.description}
                  duration={guide.duration}
                  location={guide.location}
                  rating={guide.rating || 0}
                  category={guide.category}
                  price={guide.price_usd}
                  difficulty={guide.difficulty}
                  imageUrl={guide.image_urls?.[0] || guide.image_url}
                  totalPurchases={guide.total_purchases || 0}
                  languages={guide.languages}
                  isFeatured={guide.is_featured}
                  imageLoading={idx < 4 ? 'eager' : 'lazy'}
                  creatorName="Audio Tour Guides"
                  isProcessingPayment={processingPayment === guide.id}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {!loading && remainingCount > 0 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setVisibleCount(prev => prev + 6)}
                className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-300 active:scale-95 touch-target w-full sm:w-auto justify-center"
              >
                <Headphones className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-foreground">Discover More Audio Guides</span>
                <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                  {remainingCount}
                </Badge>
                <div className="flex items-end gap-[3px] h-4 ml-1">
                  <span className="audio-wave-bar w-[2px] bg-amber-500/40 rounded-full" style={{ animationDelay: '0s' }} />
                  <span className="audio-wave-bar w-[2px] bg-amber-500/40 rounded-full" style={{ animationDelay: '0.15s' }} />
                  <span className="audio-wave-bar w-[2px] bg-amber-500/40 rounded-full" style={{ animationDelay: '0.3s' }} />
                </div>
              </button>
            </div>
          )}

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
      <section className="mobile-padding mobile-spacing bg-gradient-hero relative overflow-hidden audio-wave-decoration">
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