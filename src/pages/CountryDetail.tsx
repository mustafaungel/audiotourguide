import React, { useState, useEffect } from 'react';
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { useParams, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { GuideCard } from '@/components/GuideCard';
import { AudioPlayer } from '@/components/AudioPlayer';
import { ArrowLeft, MapPin, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCountryFromSlug, getCountryFlag, filterGuidesByCountry } from '@/lib/country-utils';

const CountryDetail = () => {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [country, setCountry] = useState('');
  const [guides, setGuides] = useState<any[]>([]);
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (countrySlug) {
      const countryName = getCountryFromSlug(countrySlug);
      if (countryName) {
        setCountry(countryName);
        fetchCountryGuides(countryName);
        if (user) {
          fetchUserPurchases();
        }
      } else {
        navigate('/country');
      }
    }
  }, [countrySlug, user, navigate]);

  const fetchCountryGuides = async (countryName: string) => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('is_published', true)
        .eq('is_approved', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const countryGuides = filterGuidesByCountry(data || [], countryName);
      setGuides(countryGuides);
    } catch (error) {
      console.error('Error fetching country guides:', error);
      toast({
        title: "Error",
        description: "Failed to load guides for this country",
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

    if (processingPayment === guideId) return;

    setProcessingPayment(guideId);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { guideId }
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No payment URL received');

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

  const countryFlag = getCountryFlag(country);

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
        "name": "Countries",
        "item": "https://audiotourguide.app/country"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": country,
        "item": `https://audiotourguide.app/country/${countrySlug}`
      }
    ]
  };

  return (
    <div className="mobile-viewport bg-background">
      <SEO 
        title={`${country} Audio Tour Guides | ${guides.length} UNESCO Sites & Cultural Heritage Tours`}
        description={`Explore ${guides.length} professional audio guides in ${country}. Discover UNESCO World Heritage sites, iconic landmarks, museums, and cultural treasures with expert-narrated immersive audio tours in multiple languages.`}
        canonicalUrl={`https://audiotourguide.app/country/${countrySlug}`}
        structuredData={breadcrumbSchema}
      />
      <Navigation />
      
      {/* Header Section */}
      <section className="mobile-padding mobile-spacing bg-gradient-hero">
        <div className="mobile-container max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => navigate('/country')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Countries
          </Button>

          <div className="text-center">
            {/* Country Flag */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-5xl mb-4 mx-auto">
              {countryFlag}
            </div>
            
            <h1 className="mobile-heading sm:text-3xl lg:text-4xl text-foreground mb-4">
              Audio Guides in {country}
            </h1>
            <p className="mobile-text sm:text-lg text-muted-foreground mb-6">
              Discover cultural heritage sites, iconic landmarks, and hidden gems in {country} with immersive audio experiences.
            </p>

            {/* Stats */}
            <div className="inline-flex items-center gap-2 mobile-padding rounded-full bg-card/20 backdrop-blur-md border border-border/50">
              <Headphones className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {guides.length} guide{guides.length !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Guides Section */}
      <section className="mobile-padding mobile-spacing">
        <div className="mobile-container">
          {/* Loading State */}
          {loading && (
            <AudioGuideLoader variant="card" count={6} />
          )}

          {/* Guides Grid */}
          {!loading && guides.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {guides.map(guide => {
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

          {/* No Guides */}
          {!loading && guides.length === 0 && (
            <div className="text-center py-16 mobile-spacing">
              <div className="text-6xl mb-4">{countryFlag}</div>
              <h3 className="mobile-subheading text-foreground mb-2">
                No audio guides available for {country}
              </h3>
              <p className="mobile-caption">
                We're working on adding more destinations. Check back soon or explore other countries.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/country')}
              >
                Explore Other Countries
              </Button>
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
          <h2 className="mobile-heading sm:text-3xl text-foreground mb-4">
            Explore More Destinations
          </h2>
          <p className="mobile-text text-muted-foreground mb-6">
            Discover audio guides from countries around the world and immerse yourself in diverse cultures and histories.
          </p>
          <div className="mobile-stack sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="lg"
              className="mobile-button px-8 py-4 touch-target"
              onClick={() => navigate('/country')}
            >
              Browse All Countries
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="mobile-button px-8 py-4 touch-target"
              onClick={() => navigate('/')}
            >
              Featured Guides
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CountryDetail;