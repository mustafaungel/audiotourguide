import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GuideCard } from '@/components/GuideCard';
import { Navigation } from '@/components/Navigation';
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
        variant: "destructive"
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

  const handlePlayGuide = async (guide: any) => {
    setSelectedGuide(guide);

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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://guided-sound-ai.lovable.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Audio Guides",
        "item": "https://guided-sound-ai.lovable.app/guides"
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
      "item": `https://guided-sound-ai.lovable.app/guides/${guide.slug}`
    }))
  } : null;

  const schemas = [breadcrumbSchema];
  if (itemListSchema) schemas.push(itemListSchema);

  return (
    <div className="mobile-viewport bg-background">
      <SEO 
        title="All Audio Guides"
        description="Browse our complete collection of audio tour guides. Explore UNESCO World Heritage sites, museums, and cultural landmarks worldwide."
        canonicalUrl="https://guided-sound-ai.lovable.app/guides"
        structuredData={schemas}
      />
      <Navigation />
      
      {/* Page Header */}
      <section className="mobile-padding mobile-spacing bg-gradient-subtle">
        <div className="mobile-container text-center">
          <div className="inline-flex items-center gap-2 mobile-padding rounded-full bg-card/20 backdrop-blur-md border border-border/50 mb-4">
            <Headphones className="h-4 w-4 text-primary" />
            <span className="mobile-caption font-medium">Audio Guides</span>
          </div>
          <h1 className="mobile-heading sm:text-3xl lg:text-4xl text-foreground mb-4">
            Discover Amazing Audio Guides
          </h1>
          <p className="mobile-text text-muted-foreground max-w-2xl mx-auto">
            Explore the world through immersive audio experiences. Search by destination, category, or guide name.
          </p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="mobile-card animate-pulse">
                  <div className="aspect-mobile bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          )}

          {/* Guides Grid */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    creatorName="Guide Creator"
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
    </div>
  );
};

export default Guides;