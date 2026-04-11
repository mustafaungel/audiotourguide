import React, { useState, useEffect } from 'react';
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GuideCard } from '@/components/GuideCard';

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
      toast({
        title: "Error",
        description: "Failed to load featured guides",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Featured Audio Guides"
        description="Explore our handpicked collection of the best audio tour guides for UNESCO World Heritage sites and cultural attractions worldwide."
        canonicalUrl="https://audiotourguide.app/featured-guides"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://audiotourguide.app" },
              { "@type": "ListItem", "position": 2, "name": "Featured Guides", "item": "https://audiotourguide.app/featured-guides" }
            ]
          }
        ]}
      />
      <Navigation />
      
      {/* Header Section */}
      <section className="py-8 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/20 backdrop-blur-md border border-border/50 mb-4">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Featured Collection</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Featured Audio Guides
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover our handpicked collection of the most popular and highest-rated audio guides from around the world.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search featured guides..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card/50 backdrop-blur-sm border-border/50"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Search Results Info */}
          {searchTerm && (
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">
                {loading ? 'Searching...' : `Found ${filteredGuides.length} featured guide(s) for "${searchTerm}"`}
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

          {/* No Results */}
          {!loading && filteredGuides.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm ? 'No featured guides found' : 'No featured guides available'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Try searching with different keywords or browse all guides' 
                  : 'Featured guides will appear here once they are selected by our team'
                }
              </p>
              {searchTerm ? (
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear search
                  </Button>
                  <Button onClick={() => navigate('/guides')}>
                    Browse All Guides
                  </Button>
                </div>
              ) : (
                <Button onClick={() => navigate('/guides')}>
                  Browse All Guides
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FeaturedGuides;
