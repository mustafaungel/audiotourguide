import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUniqueCountries, createCountrySlug } from '@/lib/country-utils';

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
      toast({
        title: "Error",
        description: "Failed to load countries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountryClick = (country: string) => {
    const slug = createCountrySlug(country);
    navigate(`/country/${slug}`);
  };

  return (
    <div className="mobile-viewport bg-background">
      <Navigation />
      
      {/* Header Section */}
      <section className="mobile-padding mobile-spacing bg-gradient-hero">
        <div className="mobile-container max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 mobile-padding rounded-full bg-card/20 backdrop-blur-md border border-border/50 mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Explore by Country</span>
          </div>
          
          <h1 className="mobile-heading sm:text-3xl lg:text-4xl text-foreground mb-4">
            Discover Audio Guides by Country
          </h1>
          <p className="mobile-text sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose a destination and explore UNESCO World Heritage sites, cultural landmarks, and hidden gems with immersive audio experiences.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card/50 backdrop-blur-sm border-border/50 touch-target mobile-text"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Countries Grid */}
      <section className="mobile-padding mobile-spacing">
        <div className="mobile-container">
          {/* Search Results Info */}
          {searchTerm && (
            <div className="text-center mb-6">
              <p className="mobile-caption">
                {loading ? 'Searching...' : `Found ${filteredCountries.length} country(ies) for "${searchTerm}"`}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <Card key={i} className="mobile-card animate-pulse">
                  <CardContent className="p-4 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4 mx-auto"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Countries Grid */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredCountries.map(({ country, flag, count }) => (
                <Card 
                  key={country}
                  className="mobile-card hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
                  onClick={() => handleCountryClick(country)}
                >
                  <CardContent className="p-4 text-center">
                    {/* Flag Circle */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-3xl mb-3 mx-auto group-hover:from-primary/20 group-hover:to-accent/20 transition-colors overflow-hidden">
                      {flag}
                    </div>
                    
                    {/* Country Name */}
                    <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                      {country}
                    </h3>
                    
                    {/* Guide Count */}
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Headphones className="h-3 w-3" />
                      <span>{count} guide{count !== 1 ? 's' : ''}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
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
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchTerm('')}
                >
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
    </div>
  );
};

export default Countries;