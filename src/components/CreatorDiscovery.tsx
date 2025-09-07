import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VerificationBadge } from '@/components/VerificationBadge';
import { TierBadge } from '@/components/TierBadge';
import { 
  Star, 
  MapPin, 
  Users, 
  Search,
  Filter,
  TrendingUp,
  Crown,
  UserPlus,
  MessageCircle,
  Play,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Creator {
  id: string;
  user_id: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  specialties: string[];
  verification_status: string;
  verification_badge_type: string;
  location?: string;
  followers_count?: number;
  total_guides?: number;
  total_plays?: number;
  avg_rating?: number;
  is_trending?: boolean;
  current_tier?: string;
  tier_points?: number;
}

export const CreatorDiscovery: React.FC = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [followedCreators, setFollowedCreators] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCreators();
  }, []);

  useEffect(() => {
    filterAndSortCreators();
  }, [creators, searchQuery, locationFilter, specialtyFilter, sortBy]);

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          current_tier,
          tier_points
        `)
        .eq('role', 'content_creator')
        .eq('verification_status', 'verified');

      if (error) throw error;

      // Enhance with stats
      const enhancedCreators = await Promise.all(
        (data || []).map(async (creator) => {
          const stats = await calculateCreatorStats(creator.user_id);
          return {
            ...creator,
            ...stats,
            is_trending: Math.random() > 0.7 // Mock trending status
          };
        })
      );

      setCreators(enhancedCreators);
    } catch (error) {
      console.error('Error fetching creators:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load creators",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCreatorStats = async (userId: string) => {
    try {
      // Get published guides
      const { data: guides, count: totalGuides } = await supabase
        .from('audio_guides')
        .select('id, rating, total_purchases', { count: 'exact' })
        .eq('creator_id', userId)
        .eq('is_published', true)
        .eq('is_approved', true);

      if (!guides) return {};

      // Calculate stats
      const totalPurchases = guides.reduce((sum, g) => sum + (g.total_purchases || 0), 0);
      const avgRating = guides.length 
        ? guides.reduce((sum, g) => sum + (g.rating || 0), 0) / guides.length
        : 0;

      return {
        total_guides: totalGuides || 0,
        followers_count: totalPurchases * 2, // Rough estimation
        total_plays: totalPurchases * 8, // Rough estimation
        avg_rating: Math.round(avgRating * 10) / 10
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {};
    }
  };

  const filterAndSortCreators = () => {
    let filtered = [...creators];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(creator =>
        creator.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(creator =>
        creator.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Specialty filter
    if (specialtyFilter !== 'all') {
      filtered = filtered.filter(creator =>
        creator.specialties.some(s => s.toLowerCase().includes(specialtyFilter.toLowerCase()))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'trending':
          if (a.is_trending && !b.is_trending) return -1;
          if (!a.is_trending && b.is_trending) return 1;
          return (b.total_plays || 0) - (a.total_plays || 0);
        case 'followers':
          return (b.followers_count || 0) - (a.followers_count || 0);
        case 'rating':
          return (b.avg_rating || 0) - (a.avg_rating || 0);
        case 'guides':
          return (b.total_guides || 0) - (a.total_guides || 0);
        case 'tier':
          return (b.tier_points || 0) - (a.tier_points || 0);
        default:
          return 0;
      }
    });

    setFilteredCreators(filtered);
  };

  const toggleFollow = (creatorId: string) => {
    setFollowedCreators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(creatorId)) {
        newSet.delete(creatorId);
      } else {
        newSet.add(creatorId);
      }
      return newSet;
    });
    
    toast({
      title: followedCreators.has(creatorId) ? "Unfollowed" : "Following!",
      description: "Follow status updated",
    });
  };

  const handleMessage = () => {
    toast({
      title: "Coming Soon",
      description: "Creator messaging will be available soon!",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getUniqueLocations = () => {
    const locations = creators
      .map(c => c.location)
      .filter(Boolean)
      .map(loc => loc!.split(',')[0].trim());
    return [...new Set(locations)];
  };

  const getUniqueSpecialties = () => {
    const specialties = creators.flatMap(c => c.specialties);
    return [...new Set(specialties)];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded-full w-20 mx-auto mb-4"></div>
                <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-primary border-none shadow-tourism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary-foreground">
            <Crown className="h-6 w-6" />
            Discover Creators
          </CardTitle>
          <p className="text-primary-foreground/80">
            Connect with verified local experts and cultural storytellers from around the world
          </p>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {getUniqueLocations().map(location => (
                  <SelectItem key={location} value={location.toLowerCase()}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {getUniqueSpecialties().map(specialty => (
                  <SelectItem key={specialty} value={specialty.toLowerCase()}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="followers">Most Followers</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="guides">Most Guides</SelectItem>
                <SelectItem value="tier">Tier Ranking</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {filteredCreators.length} Creator{filteredCreators.length !== 1 ? 's' : ''} Found
        </h2>
        
        {searchQuery && (
          <Badge variant="secondary">
            Searching for: {searchQuery}
          </Badge>
        )}
      </div>

      {/* Creator Grid */}
      {filteredCreators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => (
            <Card 
              key={creator.id} 
              className="bg-gradient-card border-border/50 shadow-card hover:shadow-glow hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/creator/${creator.user_id}`)}
            >
              <CardContent className="p-6">
                {/* Creator Avatar & Basic Info */}
                <div className="text-center mb-4">
                  <div className="relative inline-block">
                    <Avatar className="h-20 w-20 border-2 border-tourism-warm mx-auto">
                      <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                      <AvatarFallback className="bg-tourism-warm text-primary-foreground font-bold text-xl">
                        {creator.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="absolute -bottom-1 -right-1">
                      <VerificationBadge 
                        type={creator.verification_badge_type as any}
                        size="sm"
                      />
                    </div>
                    
                    {creator.is_trending && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-red-500 text-white animate-pulse text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          VIRAL
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg mt-3 mb-1">{creator.full_name}</h3>
                  
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TierBadge tier={creator.current_tier || 'bronze'} size="sm" />
                    {creator.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {creator.location}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {creator.bio}
                  </p>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1 justify-center mb-4">
                  {creator.specialties.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {creator.specialties.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{creator.specialties.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">{formatNumber(creator.followers_count || 0)}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold">{creator.total_guides || 0}</div>
                    <div className="text-xs text-muted-foreground">Guides</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {creator.avg_rating?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold">{formatNumber(creator.total_plays || 0)}</div>
                    <div className="text-xs text-muted-foreground">Plays</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(creator.id);
                    }}
                    className={`flex-1 ${
                      followedCreators.has(creator.id)
                        ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                        : 'bg-tourism-warm hover:bg-tourism-warm/90 text-primary-foreground'
                    }`}
                    size="sm"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    {followedCreators.has(creator.id) ? 'Following' : 'Follow'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMessage();
                    }}
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No creators found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}
    </div>
  );
};