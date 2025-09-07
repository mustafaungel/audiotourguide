import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LiveExperienceCard } from './LiveExperienceCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LiveExperience {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  experience_type: string;
  duration_minutes: number;
  price_usd: number;
  max_participants: number;
  location?: string;
  image_url?: string;
  difficulty_level: string;
  category: string;
  language: string;
  creator?: {
    full_name: string;
    avatar_url?: string;
    verification_status: string;
  };
}

interface LiveExperiencesListProps {
  title?: string;
  showFilters?: boolean;
  limit?: number;
  category?: string;
  creatorId?: string;
}

export const LiveExperiencesList: React.FC<LiveExperiencesListProps> = ({
  title = "Live Experiences",
  showFilters = true,
  limit,
  category,
  creatorId
}) => {
  const [experiences, setExperiences] = useState<LiveExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [selectedType, setSelectedType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const { toast } = useToast();

  const categories = ['culture', 'food', 'nature', 'history', 'art'];
  const experienceTypes = ['virtual_tour', 'live_walkthrough', 'cultural_experience', 'cooking_class'];

  useEffect(() => {
    fetchExperiences();
  }, [selectedCategory, selectedType, priceRange, category, creatorId, limit]);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('live_experiences')
        .select(`
          *,
          creator:profiles(
            full_name,
            avatar_url,
            verification_status
          )
        `)
        .eq('is_active', true);

      // Apply filters
      if (category && category !== 'all') {
        query = query.eq('category', category);
      } else if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (selectedType && selectedType !== 'all') {
        query = query.eq('experience_type', selectedType);
      }

      if (creatorId) {
        query = query.eq('creator_id', creatorId);
      }

      if (priceRange && priceRange !== 'all') {
        switch (priceRange) {
          case 'under-50':
            query = query.lt('price_usd', 50);
            break;
          case '50-100':
            query = query.gte('price_usd', 50).lte('price_usd', 100);
            break;
          case 'over-100':
            query = query.gt('price_usd', 100);
            break;
        }
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      query = query.order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching experiences:', error);
        toast({
          title: "Error",
          description: "Failed to load live experiences",
          variant: "destructive"
        });
        return;
      }

      // Type assertion to handle the joined data properly
      const experiencesWithCreator = (data || []).map(exp => ({
        ...exp,
        creator: Array.isArray(exp.creator) ? exp.creator[0] : exp.creator
      })) as LiveExperience[];
      
      setExperiences(experiencesWithCreator);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Debounce search
    const timer = setTimeout(() => {
      fetchExperiences();
    }, 300);
    return () => clearTimeout(timer);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted h-48 rounded-t-lg"></div>
              <div className="bg-card p-4 rounded-b-lg space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-1">
            {experiences.length} experience{experiences.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {showFilters && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search experiences..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Experience Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {experienceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-50">Under $50</SelectItem>
                <SelectItem value="50-100">$50 - $100</SelectItem>
                <SelectItem value="over-100">Over $100</SelectItem>
              </SelectContent>
            </Select>

            {(selectedCategory !== 'all' || selectedType !== 'all' || priceRange !== 'all' || searchQuery) && (
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedType('all');
                  setPriceRange('all');
                  setSearchQuery('');
                  fetchExperiences();
                }}
              >
                Clear Filters
              </Badge>
            )}
          </div>
        </div>
      )}

      {experiences.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No experiences found</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory !== 'all' || selectedType !== 'all' || priceRange !== 'all'
              ? "Try adjusting your filters to see more results"
              : "Check back later for new live experiences"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiences.map((experience) => (
            <LiveExperienceCard
              key={experience.id}
              experience={experience}
            />
          ))}
        </div>
      )}
    </div>
  );
};