import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Filter, Star, MapPin, Users, MessageCircle, Heart, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TierBadge } from '@/components/TierBadge';
import { VerificationBadge } from '@/components/VerificationBadge';
import { toast } from '@/hooks/use-toast';

interface Creator {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  verification_status: string;
  specialties: string[];
  location: string;
  current_tier: string;
  tier_points: number;
  experience_years: number;
  languages_spoken: string[];
  followers_count: number;
  total_guides: number;
  avg_rating: number;
  total_plays: number;
  social_profiles: any;
  verified_at: string;
  creator_badge: boolean;
}

export const EnhancedCreatorDiscovery = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [sortBy, setSortBy] = useState('tier_weighted');
  const [followedCreators, setFollowedCreators] = useState<Set<string>>(new Set());
  const [showSpotlight, setShowSpotlight] = useState(true);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchCreators();
    fetchFollowedCreators();
  }, []);

  useEffect(() => {
    filterAndSortCreators();
  }, [creators, searchQuery, locationFilter, specialtyFilter, tierFilter, sortBy]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          bio,
          avatar_url,
          verification_status,
          specialties,
          guide_country,
          current_tier,
          tier_points,
          experience_years,
          languages_spoken,
          social_profiles,
          verified_at,
          creator_badge
        `)
        .eq('role', 'content_creator')
        .eq('verification_status', 'verified');

      if (error) throw error;

      if (!profilesData) {
        setCreators([]);
        return;
      }

      // Calculate creator stats
      const creatorsWithStats = await Promise.all(
        profilesData.map(async (profile) => {
          const stats = await calculateCreatorStats(profile.user_id);
          return {
            id: profile.user_id,
            full_name: profile.full_name || 'Creator',
            bio: profile.bio || 'Cultural guide and creator',
            avatar_url: profile.avatar_url,
            verification_status: profile.verification_status,
            specialties: profile.specialties || [],
            location: profile.guide_country || 'Global',
            current_tier: profile.current_tier || 'bronze',
            tier_points: profile.tier_points || 0,
            experience_years: profile.experience_years || 0,
            languages_spoken: profile.languages_spoken || [],
            social_profiles: profile.social_profiles || {},
            verified_at: profile.verified_at,
            creator_badge: profile.creator_badge,
            ...stats
          };
        })
      );

      setCreators(creatorsWithStats);
    } catch (error) {
      console.error('Error fetching creators:', error);
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateCreatorStats = async (creatorId: string) => {
    try {
      const { data: guidesData } = await supabase
        .from('audio_guides')
        .select('rating, total_purchases, total_reviews')
        .eq('creator_id', creatorId)
        .eq('is_published', true)
        .eq('is_approved', true);

      const { count: followersCount } = await supabase
        .from('creator_connections')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('is_active', true);

      const totalGuides = guidesData?.length || 0;
      const avgRating = totalGuides > 0 
        ? guidesData.reduce((sum, guide) => sum + (guide.rating || 0), 0) / totalGuides 
        : 0;
      const totalPlays = guidesData?.reduce((sum, guide) => sum + (guide.total_purchases || 0), 0) || 0;

      return {
        followers_count: followersCount || 0,
        total_guides: totalGuides,
        avg_rating: Math.round(avgRating * 10) / 10,
        total_plays: totalPlays
      };
    } catch (error) {
      console.error('Error calculating creator stats:', error);
      return {
        followers_count: 0,
        total_guides: 0,
        avg_rating: 0,
        total_plays: 0
      };
    }
  };

  const fetchFollowedCreators = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('creator_connections')
        .select('creator_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (data) {
        setFollowedCreators(new Set(data.map(conn => conn.creator_id)));
      }
    } catch (error) {
      console.error('Error fetching followed creators:', error);
    }
  };

  const filterAndSortCreators = () => {
    let filtered = [...creators];

    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(creator =>
        creator.full_name.toLowerCase().includes(query) ||
        creator.bio.toLowerCase().includes(query) ||
        creator.specialties.some(specialty => specialty.toLowerCase().includes(query)) ||
        creator.location.toLowerCase().includes(query)
      );
    }

    if (locationFilter && locationFilter !== 'all') {
      filtered = filtered.filter(creator => creator.location === locationFilter);
    }

    if (specialtyFilter && specialtyFilter !== 'all') {
      filtered = filtered.filter(creator => 
        creator.specialties.includes(specialtyFilter)
      );
    }

    if (tierFilter && tierFilter !== 'all') {
      filtered = filtered.filter(creator => creator.current_tier === tierFilter);
    }

    // Apply sorting with tier weighting
    filtered.sort((a, b) => {
      if (sortBy === 'tier_weighted') {
        // Tier weights: Diamond=4, Gold=3, Silver=2, Bronze=1
        const tierWeights = { diamond: 4, gold: 3, silver: 2, bronze: 1 };
        const aWeight = (tierWeights[a.current_tier as keyof typeof tierWeights] || 1) * (a.avg_rating + 1) * Math.log(a.total_guides + 1);
        const bWeight = (tierWeights[b.current_tier as keyof typeof tierWeights] || 1) * (b.avg_rating + 1) * Math.log(b.total_guides + 1);
        return bWeight - aWeight;
      }
      
      switch (sortBy) {
        case 'rating':
          return b.avg_rating - a.avg_rating;
        case 'followers':
          return b.followers_count - a.followers_count;
        case 'experience':
          return b.experience_years - a.experience_years;
        case 'newest':
          return new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredCreators(filtered);
  };

  const toggleFollow = async (creatorId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow creators.",
        variant: "destructive"
      });
      return;
    }

    try {
      const isFollowing = followedCreators.has(creatorId);
      
      if (isFollowing) {
        await supabase
          .from('creator_connections')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('creator_id', creatorId);
        
        setFollowedCreators(prev => {
          const newSet = new Set(prev);
          newSet.delete(creatorId);
          return newSet;
        });
        
        toast({
          title: "Unfollowed",
          description: "You are no longer following this creator.",
        });
      } else {
        await supabase
          .from('creator_connections')
          .upsert({
            user_id: user.id,
            creator_id: creatorId,
            is_active: true,
            connection_source: 'manual_follow'
          });
        
        setFollowedCreators(prev => new Set([...prev, creatorId]));
        
        toast({
          title: "Following",
          description: "You are now following this creator.",
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status.",
        variant: "destructive"
      });
    }
  };

  const handleMessage = (creatorId: string) => {
    toast({
      title: "Coming Soon",
      description: "Direct messaging will be available soon!",
    });
  };

  const getUniqueLocations = () => {
    return [...new Set(creators.map(c => c.location))].filter(Boolean).sort();
  };

  const getUniqueSpecialties = () => {
    const allSpecialties = creators.flatMap(c => c.specialties);
    return [...new Set(allSpecialties)].filter(Boolean).sort();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getSpotlightCreators = () => {
    return creators
      .filter(c => c.current_tier === 'diamond' || (c.current_tier === 'gold' && c.avg_rating >= 4.5))
      .sort((a, b) => b.tier_points - a.tier_points)
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton loading */}
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const spotlightCreators = getSpotlightCreators();

  return (
    <div className="space-y-8">
      {/* Creator Spotlight */}
      {showSpotlight && spotlightCreators.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Featured Creators</h2>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Top Rated
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSpotlight(false)}
              >
                ×
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {spotlightCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/60 backdrop-blur cursor-pointer hover:bg-background/80 transition-colors"
                  onClick={() => navigate(`/creator/${creator.id}`)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={creator.avatar_url} />
                    <AvatarFallback>{creator.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{creator.full_name}</h4>
                      <TierBadge tier={creator.current_tier} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{creator.bio}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{creator.avg_rating}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{creator.total_guides} guides</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators by name, specialty, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="md:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {getUniqueLocations().map((location) => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {getUniqueSpecialties().map((specialty) => (
                <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="diamond">Diamond</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tier_weighted">Best Match</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="followers">Most Followed</SelectItem>
              <SelectItem value="experience">Most Experienced</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>

          <div className="col-span-2 md:col-span-1">
            <Badge variant="outline" className="w-full justify-center">
              {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {searchQuery && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Searching for:</span>
            <Badge variant="secondary" className="gap-1">
              {searchQuery}
              <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          </div>
        )}
      </div>

      {/* Creator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCreators.map((creator) => (
          <Card key={creator.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardContent className="p-6" onClick={() => navigate(`/creator/${creator.id}`)}>
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={creator.avatar_url} />
                  <AvatarFallback>{creator.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{creator.full_name}</h3>
                    {creator.verification_status === 'verified' && (
                      <VerificationBadge type="blue_tick" size="sm" showText={false} />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <TierBadge tier={creator.current_tier} size="sm" />
                    {creator.creator_badge && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                        Creator
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {creator.location}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {creator.bio}
              </p>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1 mb-4">
                {creator.specialties.slice(0, 3).map((specialty, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {creator.specialties.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{creator.specialties.length - 3}
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatNumber(creator.followers_count)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-medium">{creator.total_guides}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Guides</div>
                </div>
                
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {creator.avg_rating > 0 ? creator.avg_rating : 'New'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant={followedCreators.has(creator.id) ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => toggleFollow(creator.id)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${followedCreators.has(creator.id) ? 'fill-current' : ''}`} />
                  {followedCreators.has(creator.id) ? 'Following' : 'Follow'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMessage(creator.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCreators.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No creators found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or filters
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('');
              setLocationFilter('');
              setSpecialtyFilter('');
              setTierFilter('');
            }}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};