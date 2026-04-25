import React, { useState, useEffect, useMemo } from 'react';
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { lazy, Suspense } from 'react';
const Footer = lazy(() => import('@/components/Footer').then(m => ({ default: m.Footer })));
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUniqueCountries, createCountrySlug } from '@/lib/country-utils';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { ExploreSegmentedNav } from '@/components/ExploreSegmentedNav';

const Countries = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [countries, setCountries] = useState<Array<{country: string, flag: string, count: number}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('location')
        .eq('is_published', true)
        .eq('is_approved', true);

      if (error) throw error;
      const uniqueCountries = getUniqueCountries(data || []);
      setCountries(uniqueCountries);
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast({ title: "Error", description: "Failed to load countries", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete suggestions for countries
  const suggestions = useMemo(() => {
    return countries.map(c => ({
      label: `${c.flag} ${c.country}`,
      sublabel: `${c.count} guide${c.count !== 1 ? 's' : ''}`,
      type: 'country' as const,
      slug: createCountrySlug(c.country),
    }));
  }, [countries]);

  const filteredCountries = countries.filter(country =>
    country.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountryClick = (country: string) => {
    const slug = createCountrySlug(country);
    navigate(`/country/${slug}`);
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://audiotourguide.app" },
      { "@type": "ListItem", "position": 2, "name": "Countries", "item": "https://audiotourguide.app/country" }
    ]
  };

  return (
    <div className="mobile-viewport bg-background">
      <SEO 
        title="Audio Guides by Country | Destinations Worldwide"
        description="Browse audio guides from 20+ countries. Explore UNESCO sites, museums, and cultural landmarks with expert narration."
        canonicalUrl="https://audiotourguide.app/country"
        structuredData={breadcrumbSchema}
      />
      <Navigation />
      <ExploreSegmentedNav active="places" />

      {/* Compact header — full hero on desktop only; mobile shows just the
          search bar so countries appear above the fold. */}
      <h1 className="sr-only">Audio Guides by Country</h1>
      <section className="hidden md:block mobile-section">
        <div className="mobile-container max-w-4xl text-center">
          <div className="discover-hero-panel">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/20 backdrop-blur-md border border-border/50 px-4 py-2 mb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Explore by Country</span>
            </div>

            <h2 className="mobile-heading sm:text-3xl lg:text-4xl text-foreground mb-4">
              Discover Audio Guides by Country
            </h2>
            <p className="mobile-text sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Choose a destination and explore UNESCO World Heritage sites, cultural landmarks, and hidden gems with immersive audio experiences.
            </p>

            <div className="max-w-md mx-auto">
              <SearchAutocomplete
                value={searchTerm}
                onChange={setSearchTerm}
                suggestions={suggestions}
                placeholder="Search countries..."
                onNavigate={(s) => {
                  if (s.slug) navigate(`/country/${s.slug}`);
                }}
              />
            </div>
          </div>
        </div>
      </section>


      {/* Countries Grid */}
      <section className="mobile-section">
        <div className="mobile-container">
          {/* Results count */}
          <div className="text-center mb-6">
            <p className="mobile-caption">
              {loading ? 'Loading...' : searchTerm 
                ? `Found ${filteredCountries.length} country(ies) for "${searchTerm}"`
                : `${countries.length} countries available`
              }
            </p>
          </div>

          {loading && <AudioGuideLoader variant="grid" count={12} />}

          {!loading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredCountries.map(({ country, flag, count }) => (
                <Card 
                  key={country}
                  className="mobile-surface rounded-[24px] border-border/30 audio-card-glow transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
                  onClick={() => handleCountryClick(country)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-3xl mb-3 mx-auto group-hover:from-primary/20 group-hover:to-accent/20 transition-colors overflow-hidden">
                      {flag}
                    </div>
                    <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                      {country}
                    </h3>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Headphones className="h-3.5 w-3.5 text-primary/60" />
                      <span>{count} guide{count !== 1 ? 's' : ''}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredCountries.length === 0 && (
            <div className="text-center py-16 mobile-spacing">
              <div className="text-6xl mb-4">🌍</div>
              <h3 className="mobile-subheading text-foreground mb-2">
                {searchTerm ? 'No countries found' : 'No countries available'}
              </h3>
              <p className="mobile-caption">
                {searchTerm 
                  ? 'Try searching for a different country name' 
                  : 'Audio guides will appear here once they are added and approved'
                }
              </p>
              {searchTerm && (
                <Button variant="outline" className="mt-4" onClick={() => setSearchTerm('')}>
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mobile-padding mobile-spacing bg-gradient-hero">
        <div className="mobile-container max-w-4xl text-center">
          <h2 className="mobile-heading sm:text-3xl text-foreground mb-4">
            Can't Find Your Destination?
          </h2>
          <p className="mobile-text text-muted-foreground mb-6">
            We're constantly adding new destinations and audio guides. Check back soon or browse our featured guides.
          </p>
          <Button
            variant="hero"
            size="lg"
            className="mobile-button px-8 py-4 touch-target"
            onClick={() => navigate('/featured-guides')}
          >
            Browse Featured Guides
          </Button>
        </div>
      </section>
      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default Countries;
