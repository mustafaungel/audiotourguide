import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { GuideCard } from '@/components/GuideCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Grid, List, Map, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Guide {
  id: string;
  title: string;
  location: string;
  category: string;
  price_usd: number;
  rating: number;
  duration: number;
  total_purchases: number;
  image_url?: string;
  description?: string;
  difficulty_level?: string;
  creator_name?: string;
  creator_avatar?: string;
  creator_id?: string;
}

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const sortBy = searchParams.get('sort') || 'relevance';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const categories = [
    'all',
    'UNESCO Heritage',
    'Cultural Sites',
    'Natural Wonders',
    'Historical Tours',
    'Architecture',
    'Museums'
  ];

  useEffect(() => {
    fetchGuides();
  }, [query, category, sortBy, minPrice, maxPrice]);

  const fetchGuides = async () => {
    setLoading(true);
    try {
      let supabaseQuery = supabase
        .from('audio_guides')
        .select(`
          *,
          profiles!creator_id (
            full_name,
            avatar_url,
            verification_status
          )
        `)
        .eq('is_published', true)
        .eq('is_approved', true);

      // Apply search filter
      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(
          `title.ilike.%${query}%,location.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`
        );
      }

      // Apply category filter
      if (category !== 'all') {
        supabaseQuery = supabaseQuery.eq('category', category);
      }

      // Apply price filters
      if (minPrice) {
        supabaseQuery = supabaseQuery.gte('price_usd', parseInt(minPrice) * 100);
      }
      if (maxPrice) {
        supabaseQuery = supabaseQuery.lte('price_usd', parseInt(maxPrice) * 100);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_low':
          supabaseQuery = supabaseQuery.order('price_usd', { ascending: true });
          break;
        case 'price_high':
          supabaseQuery = supabaseQuery.order('price_usd', { ascending: false });
          break;
        case 'rating':
          supabaseQuery = supabaseQuery.order('rating', { ascending: false });
          break;
        case 'popularity':
          supabaseQuery = supabaseQuery.order('total_purchases', { ascending: false });
          break;
        case 'newest':
          supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
          break;
        default:
          supabaseQuery = supabaseQuery.order('rating', { ascending: false });
      }

      const { data, error } = await supabaseQuery.limit(50);

      if (error) throw error;
      setGuides(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setGuides([]);
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParams = (newParams: Record<string, string>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        updated.set(key, value);
      } else {
        updated.delete(key);
      }
    });
    setSearchParams(updated);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold">
              {query ? `Search Results for "${query}"` : 'Browse All Guides'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {loading ? 'Searching...' : `Found ${guides.length} audio guides`}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search destinations, UNESCO sites, or cultural experiences..."
              value={query}
              onChange={(e) => updateSearchParams({ q: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <Select value={category} onValueChange={(value) => updateSearchParams({ category: value })}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value) => updateSearchParams({ sort: value })}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="popularity">Most Popular</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Min $"
                    value={minPrice}
                    onChange={(e) => updateSearchParams({ minPrice: e.target.value })}
                    className="w-20"
                    type="number"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    placeholder="Max $"
                    value={maxPrice}
                    onChange={(e) => updateSearchParams({ maxPrice: e.target.value })}
                    className="w-20"
                    type="number"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Filters */}
        {(category !== 'all' || minPrice || maxPrice || query) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {query && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {query}
                <button onClick={() => updateSearchParams({ q: '' })} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {category !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {category}
                <button onClick={() => updateSearchParams({ category: 'all' })} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {minPrice && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Min: ${minPrice}
                <button onClick={() => updateSearchParams({ minPrice: '' })} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {maxPrice && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Max: ${maxPrice}
                <button onClick={() => updateSearchParams({ maxPrice: '' })} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-64 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No guides found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button onClick={() => {
              setSearchParams(new URLSearchParams());
            }}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {guides.map((guide) => (
              <div key={guide.id} className={viewMode === 'list' ? 'max-w-4xl' : ''}>
                <GuideCard 
                  id={guide.id}
                  title={guide.title}
                  description={guide.description || ''}
                  location={guide.location}
                  price={guide.price_usd / 100}
                  rating={guide.rating}
                  duration={guide.duration}
                  category={guide.category}
                  difficulty={guide.difficulty_level || 'Beginner'}
                  imageUrl={guide.image_url}
                  totalPurchases={guide.total_purchases}
                  creatorName={guide.creator_name}
                  creatorAvatar={guide.creator_avatar}
                  creatorId={guide.creator_id}
                  isProcessingPayment={false}
                  onViewGuide={() => navigate(`/guide/${guide.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;