import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GuideCard } from '@/components/GuideCard';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Headphones, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Guides = () => {
  const navigate = useNavigate();
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cached query — no refetch on back navigation
  const { data: guides = [], isLoading: loading } = useQuery({
    queryKey: ['guides-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('is_published', true)
        .eq('is_approved', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (user) fetchUserPurchases();
  }, [user]);

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
        variant: "destructive"
      });
      return;
    }

    if (processingPayment === guideId) {
      return;
    }

    setProcessingPayment(guideId);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { guideId }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No payment URL received');
      }

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
      setTimeout(() => {
        setProcessingPayment(null);
      }, 2000);
    }
  };

  const filteredGuides = guides.filter(guide => 
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayGuide = (guide: any) => {
    setSelectedGuide(guide);
    supabase.functions.invoke('track-viral-engagement', {
      body: { action: 'view', guide_id: guide.id }
    }).catch(err => console.error('Error tracking guide view:', err));
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://audiotourguide.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Audio Guides",
        "item": "https://audiotourguide.app/guides"
      }
    ]
  };

  const itemListSchema = !loading && guides.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": guides.slice(0, 10).map((guide, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": guide.title,
      "item": `https://audiotourguide.app/guides/${guide.slug}`
    }))
  } : null;

  const schemas = [breadcrumbSchema];
  if (itemListSchema) schemas.push(itemListSchema);

  return (
    <div className="mobile-viewport bg-background">
      <SEO 
        title="Browse Audio Guides | Museums, Cities & Heritage Sites"
        description="Browse expert-narrated audio guides for UNESCO sites, museums, and cultural landmarks worldwide. Multi-language support."
        canonicalUrl="https://audiotourguide.app/guides"
        structuredData={schemas}
      />
      <Navigation />
      
      {/* Page Header */}
      <section className="mobile-padding mobile-spacing bg-gradient-subtle relative overflow-hidden">
        <div className="audio-hero-silhouette" />
        <div className="mobile-container text-center relative z-10">
          <div className="inline-flex items-center gap-2 mobile-padding rounded-full audio-premium-badge mb-4">
            <Headphones className="h-4 w-4 text-primary" />
            <span className="mobile-caption font-medium">Audio Guides</span>
          </div>
          <h1 className="mobile-heading sm:text-3xl lg:text-4xl text-foreground mb-4">
            Discover Amazing Audio Guides
          </h1>
          <h2 className="mobile-text text-muted-foreground max-w-2xl mx-auto">
            Explore the world through immersive audio experiences. Search by destination, category, or guide name.
          </h2>
        </div>
      </section>

      {/* Search and Guides Section */}
      <section className="mobile-padding mobile-spacing">
        <div className="mobile-container">
          {/* Enhanced Search and Filter */}
          <div className="mobile-stack max-w-2xl mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by destination, category, or guide name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card/50 backdrop-blur-sm border-border/50 touch-target mobile-text"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 sm:flex-none touch-target">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              {searchTerm && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSearchTerm('')}
                  className="text-muted-foreground hover:text-foreground touch-target px-4"
                >
                  Clear
                </Button>
              )}
            </div>
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
            <AudioGuideLoader variant="card" count={6} />
          )}

          {/* Guides Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredGuides.map(guide => {
                const isPurchased = userPurchases.includes(guide.id);
                
                return (
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
                    creatorName="Audio Tour Guides"
                    isProcessingPayment={processingPayment === guide.id}
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
            <div className="text-center py-16 mobile-spacing">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="mobile-subheading text-foreground mb-2">No audio guides found</h3>
              <p className="mobile-caption">
                Try searching for different destinations, categories, or keywords
              </p>
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
      <Footer />
    </div>
  );
};

export default Guides;