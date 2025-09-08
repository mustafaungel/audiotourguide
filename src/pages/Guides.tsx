import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { GuideCard } from '@/components/GuideCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Filter, Grid, List, MapPin, Star, Clock, DollarSign, X } from 'lucide-react';

interface Guide {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  price_usd: number;
  duration: number;
  difficulty: string;
  rating: number;
  total_purchases: number;
  total_reviews: number;
  image_url?: string;
  image_urls?: string[];
  creator_id?: string;
  languages: string[];
  best_time?: string;
}

interface FilterState {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  difficulty: string;
  minDuration: number;
  maxDuration: number;
  sortBy: string;
}

const CATEGORIES = [
  'Historical Sites',
  'Museums & Galleries',
  'Cultural Tours',
  'Nature & Wildlife',
  'Food & Cuisine',
  'Architecture',
  'Religious Sites',
  'Local Markets',
  'Street Art',
  'Neighborhoods'
];

const DIFFICULTIES = ['easy', 'moderate', 'challenging'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'duration_short', label: 'Shortest Duration' },
  { value: 'duration_long', label: 'Longest Duration' },
];

const Guides: React.FC = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    minPrice: 0,
    maxPrice: 100,
    difficulty: '',
    minDuration: 0,
    maxDuration: 180,
    sortBy: 'newest',
  });

  useEffect(() => {
    fetchGuides();
  }, [filters]);

  const fetchGuides = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audio_guides')
        .select('*')
        .eq('is_published', true)
        .eq('is_approved', true);

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      // Price range filter (convert to cents)
      if (filters.minPrice > 0) {
        query = query.gte('price_usd', filters.minPrice * 100);
      }
      if (filters.maxPrice < 100) {
        query = query.lte('price_usd', filters.maxPrice * 100);
      }

      // Duration filter
      if (filters.minDuration > 0) {
        query = query.gte('duration', filters.minDuration);
      }
      if (filters.maxDuration < 180) {
        query = query.lte('duration', filters.maxDuration);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_low':
          query = query.order('price_usd', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price_usd', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'popular':
          query = query.order('total_purchases', { ascending: false });
          break;
        case 'duration_short':
          query = query.order('duration', { ascending: true });
          break;
        case 'duration_long':
          query = query.order('duration', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setGuides(data || []);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast.error('Failed to load guides');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: 0,
      maxPrice: 100,
      difficulty: '',
      minDuration: 0,
      maxDuration: 180,
      sortBy: 'newest',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.difficulty) count++;
    if (filters.minPrice > 0 || filters.maxPrice < 100) count++;
    if (filters.minDuration > 0 || filters.maxDuration < 180) count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Discover Audio Guides</h1>
          <p className="text-xl text-muted-foreground">
            Explore our collection of expert-crafted audio guides from around the world
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          {/* Search and View Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search guides, locations, or topics..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All categories</SelectItem>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Difficulty</label>
                    <Select value={filters.difficulty} onValueChange={(value) => handleFilterChange('difficulty', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any difficulty</SelectItem>
                        {DIFFICULTIES.map(difficulty => (
                          <SelectItem key={difficulty} value={difficulty}>
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Price Range ($)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ''}
                        onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ''}
                        onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort by</label>
                    <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {getActiveFiltersCount() > 0 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      {filters.search && (
                        <Badge variant="secondary" className="gap-1">
                          Search: {filters.search}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleFilterChange('search', '')}
                          />
                        </Badge>
                      )}
                      {filters.category && (
                        <Badge variant="secondary" className="gap-1">
                          {filters.category}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleFilterChange('category', '')}
                          />
                        </Badge>
                      )}
                      {filters.difficulty && (
                        <Badge variant="secondary" className="gap-1">
                          {filters.difficulty}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleFilterChange('difficulty', '')}
                          />
                        </Badge>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `${guides.length} guides found`}
          </p>
        </div>

        {/* Guides Grid/List */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : guides.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No guides found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria or filters to find more guides.
                  </p>
                </div>
                {getActiveFiltersCount() > 0 && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' 
            : 'space-y-4'
          }>
            {guides.map((guide) => (
              <GuideCard
                key={guide.id}
                id={guide.id}
                title={guide.title}
                description={guide.description}
                location={guide.location}
                price={guide.price_usd / 100}
                rating={guide.rating}
                duration={guide.duration}
                category={guide.category}
                difficulty={guide.difficulty}
                imageUrl={guide.image_urls?.[0] || guide.image_url}
                totalPurchases={guide.total_purchases}
                creatorName=""
                creatorAvatar=""
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Guides;