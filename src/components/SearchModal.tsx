import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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
}

interface SearchModalProps {
  children: React.ReactNode;
}

export const SearchModal: React.FC<SearchModalProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const navigate = useNavigate();

  const categories = [
    'all',
    'UNESCO Heritage',
    'Cultural Sites',
    'Natural Wonders',
    'Historical Tours',
    'Architecture',
    'Museums'
  ];

  const searchGuides = async (query: string, category: string, sort: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      let supabaseQuery = supabase
        .from('audio_guides')
        .select('*')
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

      // Apply sorting
      switch (sort) {
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

      const { data, error } = await supabaseQuery.limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchGuides(searchTerm, categoryFilter, sortBy);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, categoryFilter, sortBy]);

  const handleGuideClick = (guide: Guide) => {
    setIsOpen(false);
    navigate(`/guide/${guide.id}`);
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${(price / 100).toFixed(2)}`;
  };

  const formatDuration = (duration: number) => {
    return `${Math.floor(duration / 60)} min`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Audio Guides
          </DialogTitle>
          <DialogDescription>
            Discover UNESCO sites, cultural experiences, and iconic landmarks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search destinations, UNESCO sites, or cultural experiences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
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
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 animate-pulse">
                    <div className="w-16 h-16 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && results.length === 0 && searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No guides found matching "{searchTerm}"</p>
                <p className="text-sm mt-1">Try different keywords or categories</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-2">
                {results.map((guide) => (
                  <div
                    key={guide.id}
                    onClick={() => handleGuideClick(guide)}
                    className="flex gap-4 p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                      {guide.image_url && (
                        <img
                          src={guide.image_url}
                          alt={guide.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{guide.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{guide.location}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current text-yellow-500" />
                              <span className="text-xs">{guide.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{formatDuration(guide.duration)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span className="text-xs">{guide.total_purchases}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <Badge variant="secondary" className="text-xs">
                            {guide.category}
                          </Badge>
                          <div className="font-medium mt-1 text-primary">
                            {formatPrice(guide.price_usd)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start typing to search for audio guides</p>
                <p className="text-sm mt-1">Search by destination, UNESCO site, or experience type</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};