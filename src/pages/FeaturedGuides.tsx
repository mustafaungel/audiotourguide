import React, { useState, useEffect } from 'react';
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, MapPin, Star, Clock, Globe, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price / 100);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'cultural': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'historical': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      'nature': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'art': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'architecture': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'museum': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Featured Audio Guides"
        description="Explore our handpicked collection of the best audio tour guides for UNESCO World Heritage sites and cultural attractions worldwide."
        canonicalUrl="https://guided-sound-ai.lovable.app/featured-guides"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://guided-sound-ai.lovable.app" },
              { "@type": "ListItem", "position": 2, "name": "Featured Guides", "item": "https://guided-sound-ai.lovable.app/featured-guides" }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides.map((guide) => (
                <Card 
                  key={guide.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none group"
                  onClick={() => navigate(`/guide/${guide.slug || guide.id}`, {
                    state: {
                      guidePreview: {
                        id: guide.id,
                        slug: guide.slug,
                        title: guide.title,
                        description: guide.description,
                        location: guide.location,
                        price: guide.price_usd,
                        duration: guide.duration,
                        category: guide.category,
                        difficulty: guide.difficulty,
                        imageUrl: guide.image_url,
                      }
                    }
                  })}
                >
                  {/* Image */}
                  <div className="aspect-video relative overflow-hidden">
                    {guide.image_url ? (
                      <img 
                        src={guide.image_url} 
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Headphones className="h-12 w-12 text-primary" />
                      </div>
                    )}
                    
                    {/* Featured Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-yellow-500/90 text-yellow-50 border-0">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className={getCategoryColor(guide.category)}>
                        {guide.category}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {guide.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{guide.location}</span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {guide.description}
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(guide.duration)}</span>
                      </div>
                      
                      {guide.rating && guide.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{guide.rating}</span>
                          {guide.total_reviews && guide.total_reviews > 0 && (
                            <span>({guide.total_reviews})</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span>{guide.languages.join(', ')}</span>
                      </div>
                    </div>

                    <Separator className="mb-4" />

                    {/* Price and Difficulty */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(guide.price_usd)}
                        </span>
                      </div>
                      
                      <Badge variant="secondary" className="capitalize">
                        {guide.difficulty}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
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
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear search
                  </Button>
                  <Button
                    onClick={() => navigate('/guides')}
                  >
                    Browse All Guides
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => navigate('/guides')}
                >
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