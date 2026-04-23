import React, { useState, useEffect, useMemo } from 'react';
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GuideCard } from '@/components/GuideCard';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';

interface AudioGuide {
  id: string;
  title: string;
  description: string;
  location: string;
  image_url?: string;
  rating?: number;
  total_reviews?: number;
  duration: number;
  price_usd: number;
  currency: string;
  category: string;
  difficulty: string;
  languages: string[];
  slug: string;
}

const FeaturedGuides = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [guides, setGuides] = useState<AudioGuide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedGuides();
  }, []);

  const fetchFeaturedGuides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('is_published', true)
        .eq('is_approved', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuides(data || []);
    } catch (error) {
      console.error('Error fetching featured guides:', error);
      toast({ title: "Error", description: "Failed to load featured guides", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    const items: { label: string; sublabel?: string; type: 'guide' | 'location'; slug?: string; id?: string }[] = [];
    const seenLocations = new Set<string>();
    guides.forEach(g => {
      items.push({ label: g.title, sublabel: g.location, type: 'guide', slug: g.slug, id: g.id });
      if (!seenLocations.has(g.location)) {
        seenLocations.add(g.location);
        items.push({ label: g.location, type: 'location' });
      }
    });
    return items;
  }, [guides]);

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mobile-page-shell">
      <SEO
        title="Featured Audio Guides"
        description="Explore our handpicked collection of the best audio tour guides for UNESCO World Heritage sites and cultural attractions worldwide."
        canonicalUrl="https://audiotourguide.app/featured-guides"
        structuredData={[{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://audiotourguide.app" },
            { "@type": "ListItem", "position": 2, "name": "Featured Guides", "item": "https://audiotourguide.app/featured-guides" }
          ]
        }]}
      />
      <Navigation />
      
      {/* Header Section */}
      <section className="mobile-section">
        <div className="mobile-container max-w-6xl">
          <div className="discover-hero-panel text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/20 backdrop-blur-md border border-border/50 mb-4">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Featured Collection</span>
            </div>
            
            <h1 className="mobile-heading sm:text-4xl lg:text-5xl text-foreground mb-4">
              Featured Audio Guides
            </h1>
            <p className="mobile-text sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover our handpicked collection of the most popular and highest-rated audio guides from around the world.
            </p>

            {/* Search with autocomplete */}
            <div className="max-w-md mx-auto">
              <SearchAutocomplete
                value={searchTerm}
                onChange={setSearchTerm}
                suggestions={suggestions}
                placeholder="Search featured guides..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="mobile-section pt-0">
        <div className="mobile-container max-w-6xl">
          {searchTerm && (
            <div className="text-center mb-6">
              <p className="mobile-caption">
                {loading ? 'Searching...' : `Found ${filteredGuides.length} featured guide(s) for "${searchTerm}"`}
              </p>
            </div>
          )}

          {loading && <AudioGuideLoader variant="card" count={6} />}

          {!loading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredGuides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  id={guide.id}
                  slug={guide.slug}
                  title={guide.title}
                  description={guide.description}
                  location={guide.location}
                  price={guide.price_usd}
                  rating={guide.rating || 0}
                  duration={guide.duration}
                  category={guide.category}
                  difficulty={guide.difficulty}
                  imageUrl={guide.image_url}
                  languages={guide.languages}
                  isFeatured={true}
                />
              ))}
            </div>
          )}

          {!loading && filteredGuides.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="mobile-subheading text-foreground mb-2">
                {searchTerm ? 'No featured guides found' : 'No featured guides available'}
              </h3>
              <p className="mobile-caption mb-6">
                {searchTerm 
                  ? 'Try searching with different keywords or browse all guides' 
                  : 'Featured guides will appear here once they are selected by our team'
                }
              </p>
              {searchTerm ? (
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setSearchTerm('')}>Clear search</Button>
                  <Button onClick={() => navigate('/guides')}>Browse All Guides</Button>
                </div>
              ) : (
                <Button onClick={() => navigate('/guides')}>Browse All Guides</Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FeaturedGuides;
