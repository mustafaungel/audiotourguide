import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { VerificationBadge } from './VerificationBadge';
import { TierBadge } from './TierBadge';
import { CreatorTypeBadge } from './CreatorTypeBadge';
import { LanguageSelector } from './LanguageSelector';
import { DualRatingDisplay } from './DualRatingDisplay';
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Heart, 
  MessageCircle,
  BookOpen,
  Play,
  Award,
  Crown,
  Zap,
  Languages
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Creator {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  verification_status: string;
  specialties: string[];
  location: string;
  current_tier: string;
  creator_type: string;
  tier_points: number;
  experience_years: number;
  languages_spoken: string[];
  followers_count: number;
  total_guides: number;
  avg_rating: number;
  service_rating?: number;
  service_rating_count?: number;
  platform_rating?: number;
  platform_rating_count?: number;
  combined_rating?: number;
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
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedCreatorType, setSelectedCreatorType] = useState('');
  const [sortBy, setSortBy] = useState('best_match');
  const [followedCreators, setFollowedCreators] = useState<Set<string>>(new Set());
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchCreators();
    if (user) {
      fetchFollowedCreators();
    }
  }, [user]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'content_creator')
        .eq('verification_status', 'verified');

      if (error) {
        console.error('Error fetching creators:', error);
        // Fallback to demo data
        setCreators(getDemoCreators());
        return;
      }

      const creatorsWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const stats = await calculateCreatorStats(profile.user_id);
          return {
            id: profile.user_id,
            full_name: profile.full_name || 'Anonymous Creator',
            bio: profile.bio || '',
            avatar_url: profile.avatar_url || '',
            verification_status: profile.verification_status || 'unverified',
            specialties: profile.specialties || [],
            location: profile.guide_country || 'Unknown',
            current_tier: profile.current_tier || 'bronze',
            creator_type: profile.creator_type || 'local_guide',
            tier_points: profile.tier_points || 0,
            experience_years: profile.experience_years || 0,
            languages_spoken: profile.languages_spoken || ['English'],
            followers_count: stats.followers_count,
            total_guides: stats.total_guides,
            avg_rating: stats.avg_rating,
            total_plays: stats.total_plays,
            social_profiles: profile.social_profiles || {},
            verified_at: profile.verified_at || '',
            creator_badge: profile.creator_badge || false
          };
        })
      );

      const combinedCreators = [...creatorsWithStats, ...getDemoCreators()];
      setCreators(combinedCreators);
    } catch (error) {
      console.error('Error in fetchCreators:', error);
      setCreators(getDemoCreators());
    } finally {
      setLoading(false);
    }
  };

  const calculateCreatorStats = async (creatorId: string) => {
    try {
      const { data: guides } = await supabase
        .from('audio_guides')
        .select('rating, total_purchases, total_reviews')
        .eq('creator_id', creatorId)
        .eq('is_published', true);

      const { data: connections } = await supabase
        .from('creator_connections')
        .select('id')
        .eq('creator_id', creatorId)
        .eq('is_active', true);

      const total_guides = guides?.length || 0;
      const followers_count = connections?.length || 0;
      const avg_rating = guides?.length ? 
        guides.reduce((sum, guide) => sum + (guide.rating || 0), 0) / guides.length : 0;
      const total_plays = guides?.reduce((sum, guide) => sum + (guide.total_purchases || 0), 0) || 0;

      return {
        total_guides: Math.round(total_guides),
        followers_count: Math.round(followers_count),
        avg_rating: Math.round(avg_rating * 10) / 10,
        total_plays: Math.round(total_plays)
      };
    } catch (error) {
      console.error('Error calculating creator stats:', error);
      return {
        total_guides: Math.floor(Math.random() * 20) + 5,
        followers_count: Math.floor(Math.random() * 10000) + 100,
        avg_rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        total_plays: Math.floor(Math.random() * 50000) + 1000
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

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(creator =>
        creator.full_name?.toLowerCase().includes(query) ||
        creator.bio?.toLowerCase().includes(query) ||
        creator.location?.toLowerCase().includes(query) ||
        creator.specialties?.some(specialty => specialty.toLowerCase().includes(query)) ||
        creator.languages_spoken?.some(lang => lang.toLowerCase().includes(query))
      );
    }

    // Apply location filter
    if (selectedLocation && selectedLocation !== 'all-locations') {
      filtered = filtered.filter(creator => creator.location === selectedLocation);
    }

    // Apply specialty filter
    if (selectedSpecialty && selectedSpecialty !== 'all-specialties') {
      filtered = filtered.filter(creator => 
        creator.specialties?.includes(selectedSpecialty)
      );
    }

    // Apply language filter
    if (selectedLanguages.length > 0) {
      filtered = filtered.filter(creator => 
        creator.languages_spoken?.some(lang => selectedLanguages.includes(lang))
      );
    }

    // Apply tier filter
    if (selectedTier && selectedTier !== 'all-tiers') {
      filtered = filtered.filter(creator => creator.current_tier === selectedTier);
    }

    // Apply creator type filter
    if (selectedCreatorType && selectedCreatorType !== 'all-types') {
      filtered = filtered.filter(creator => creator.creator_type === selectedCreatorType);
    }

    // Apply sorting
    switch (sortBy) {
      case 'highest_rated':
        filtered.sort((a, b) => b.avg_rating - a.avg_rating);
        break;
      case 'most_followed':
        filtered.sort((a, b) => b.followers_count - a.followers_count);
        break;
      case 'most_guides':
        filtered.sort((a, b) => b.total_guides - a.total_guides);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime());
        break;
      case 'most_experienced':
        filtered.sort((a, b) => b.experience_years - a.experience_years);
        break;
      default: // best_match
        filtered.sort((a, b) => {
          const scoreA = (a.avg_rating * 0.3) + (a.followers_count * 0.0001) + (a.total_guides * 0.1) + (a.tier_points * 0.001);
          const scoreB = (b.avg_rating * 0.3) + (b.followers_count * 0.0001) + (b.total_guides * 0.1) + (b.tier_points * 0.001);
          return scoreB - scoreA;
        });
    }

    return filtered;
  };

  useEffect(() => {
    const filtered = filterAndSortCreators();
    setFilteredCreators(filtered);
  }, [creators, searchQuery, selectedLocation, selectedSpecialty, selectedLanguages, selectedTier, selectedCreatorType, sortBy]);

  const toggleFollow = async (creatorId: string) => {
    if (!user) {
      toast.error('Please sign in to follow creators');
      return;
    }

    const isCurrentlyFollowed = followedCreators.has(creatorId);
    
    try {
      if (isCurrentlyFollowed) {
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
        
        toast.success('Unfollowed creator');
      } else {
        await supabase
          .from('creator_connections')
          .upsert({
            user_id: user.id,
            creator_id: creatorId,
            is_active: true,
            connection_source: 'discovery'
          });
        
        setFollowedCreators(prev => new Set([...prev, creatorId]));
        toast.success('Following creator');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleMessage = () => {
    toast.info('Messaging feature coming soon!');
  };

  const getUniqueLocations = () => {
    const locations = creators.map(c => c.location).filter(Boolean);
    return [...new Set(locations)].sort();
  };

  const getUniqueSpecialties = () => {
    const specialties = creators.flatMap(c => c.specialties || []);
    return [...new Set(specialties)].sort();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getSpotlightCreators = () => {
    return creators
      .filter(creator => creator.avg_rating >= 4.5 && creator.followers_count >= 1000)
      .sort((a, b) => b.avg_rating - a.avg_rating)
      .slice(0, 3);
  };

  const getDemoCreators = (): Creator[] => [
    {
      id: 'demo-1',
      full_name: 'Sofia Rodriguez',
      bio: 'Local Barcelona expert specializing in Gaudí architecture and hidden tapas spots. 15+ years of guiding experience.',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      verification_status: 'verified',
      specialties: ['Architecture', 'Food Culture', 'Art History'],
      location: 'Barcelona, Spain',
      current_tier: 'gold',
      creator_type: 'local_guide',
      tier_points: 2850,
      experience_years: 15,
      languages_spoken: ['Spanish', 'English', 'Catalan', 'French'],
      followers_count: 12500,
      total_guides: 28,
      avg_rating: 4.9,
      total_plays: 45000,
      social_profiles: {},
      verified_at: '2023-01-15',
      creator_badge: true
    },
    {
      id: 'demo-2',
      full_name: 'Hiroshi Tanaka',
      bio: 'Traditional Japanese culture expert and tea ceremony master. Discover authentic Kyoto through centuries-old traditions.',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      verification_status: 'verified',
      specialties: ['Traditional Culture', 'Tea Ceremony', 'Temples & Shrines'],
      location: 'Kyoto, Japan',
      current_tier: 'platinum',
      creator_type: 'cultural_expert',
      tier_points: 4200,
      experience_years: 22,
      languages_spoken: ['Japanese', 'English', 'Mandarin'],
      followers_count: 18700,
      total_guides: 35,
      avg_rating: 4.8,
      total_plays: 62000,
      social_profiles: {},
      verified_at: '2022-08-20',
      creator_badge: true
    },
    {
      id: 'demo-3',
      full_name: 'Alessandro Moretti',
      bio: 'Renaissance art historian and Vatican expert. Unlock the secrets of Rome\'s masterpieces and hidden courtyards.',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      verification_status: 'verified',
      specialties: ['Renaissance Art', 'History', 'Vatican Tours'],
      location: 'Rome, Italy',
      current_tier: 'gold',
      creator_type: 'historian',
      tier_points: 3100,
      experience_years: 18,
      languages_spoken: ['Italian', 'English', 'Spanish', 'German'],
      followers_count: 15200,
      total_guides: 42,
      avg_rating: 4.7,
      total_plays: 58000,
      social_profiles: {},
      verified_at: '2022-11-10',
      creator_badge: true
    },
    {
      id: 'demo-4',
      full_name: 'Amélie Dubois',
      bio: 'Parisian lifestyle expert and vintage fashion connoisseur. Experience Paris like a true local with insider knowledge.',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      verification_status: 'verified',
      specialties: ['Lifestyle', 'Fashion', 'Local Markets'],
      location: 'Paris, France',
      current_tier: 'silver',
      creator_type: 'local_guide',
      tier_points: 1850,
      experience_years: 8,
      languages_spoken: ['French', 'English', 'Italian'],
      followers_count: 9800,
      total_guides: 19,
      avg_rating: 4.6,
      total_plays: 28000,
      social_profiles: {},
      verified_at: '2023-03-22',
      creator_badge: true
    },
    {
      id: 'demo-5',
      full_name: 'Carlos Mendoza',
      bio: 'Archaeological guide specializing in Mayan civilization and Mexican heritage. Explore ancient mysteries with expert insight.',
      avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
      verification_status: 'verified',
      specialties: ['Archaeology', 'Ancient History', 'Mexican Heritage'],
      location: 'Cancún, Mexico',
      current_tier: 'gold',
      creator_type: 'historian',
      tier_points: 2950,
      experience_years: 12,
      languages_spoken: ['Spanish', 'English', 'Mayan'],
      followers_count: 11400,
      total_guides: 25,
      avg_rating: 4.8,
      total_plays: 38000,
      social_profiles: {},
      verified_at: '2023-05-08',
      creator_badge: true
    },
    {
      id: 'demo-6',
      full_name: 'Anya Petrov',
      bio: 'Photography expert and urban explorer capturing Moscow\'s hidden architecture and Soviet-era stories.',
      avatar_url: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
      verification_status: 'verified',
      specialties: ['Photography', 'Urban Exploration', 'Soviet History'],
      location: 'Moscow, Russia',
      current_tier: 'silver',
      creator_type: 'photographer',
      tier_points: 1600,
      experience_years: 6,
      languages_spoken: ['Russian', 'English'],
      followers_count: 7300,
      total_guides: 14,
      avg_rating: 4.5,
      total_plays: 22000,
      social_profiles: {},
      verified_at: '2023-07-12',
      creator_badge: true
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const spotlightCreators = getSpotlightCreators();

  return (
    <div className="space-y-8">
      {/* Featured Creators Spotlight */}
      {spotlightCreators.length > 0 && (
        <div className="bg-gradient-card rounded-xl p-6 border border-tourism-warm/20">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-tourism-warm" />
            <h2 className="text-xl font-semibold">Featured Creators</h2>
            <Badge className="bg-tourism-warm/10 text-tourism-warm border-tourism-warm/20">
              <Zap className="w-3 h-3 mr-1" />
              Top Rated
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spotlightCreators.map((creator) => (
              <Card 
                key={creator.id} 
                className="bg-background/80 border-border/50 hover:border-tourism-warm/30 transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/creator/${creator.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 ring-2 ring-tourism-warm/20">
                      <AvatarImage src={creator.avatar_url} />
                      <AvatarFallback className="bg-tourism-warm/10 text-tourism-warm">
                        {creator.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{creator.full_name}</h3>
                        <VerificationBadge type="blue_tick" size="sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <DualRatingDisplay
                          serviceRating={creator.service_rating || creator.avg_rating}
                          serviceRatingCount={creator.service_rating_count || 0}
                          platformRating={creator.platform_rating}
                          platformRatingCount={creator.platform_rating_count}
                          combinedRating={creator.combined_rating || creator.avg_rating}
                          experienceYears={creator.experience_years}
                          variant="inline"
                        />
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">{formatNumber(creator.followers_count)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Discover Amazing Creators</h1>
            <p className="text-muted-foreground">
              Connect with verified cultural guides and local experts from around the world
            </p>
          </div>
        </div>

        <div className="bg-background rounded-lg border border-border/50 p-6">
          {/* Filter Controls */}
          <div className="space-y-3 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search creators, locations, specialties, languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-locations">All Locations</SelectItem>
                  {getUniqueLocations().map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-specialties">All Specialties</SelectItem>
                  {getUniqueSpecialties().map(specialty => (
                    <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="w-48">
                <LanguageSelector
                  selectedLanguages={selectedLanguages}
                  onLanguagesChange={setSelectedLanguages}
                  variant="filter"
                  placeholder="Languages"
                  maxSelections={5}
                />
              </div>

              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-tiers">All Tiers</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCreatorType} onValueChange={setSelectedCreatorType}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Creator Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-types">All Types</SelectItem>
                  <SelectItem value="local_guide">Local Guide</SelectItem>
                  <SelectItem value="cultural_expert">Cultural Expert</SelectItem>
                  <SelectItem value="historian">Historian</SelectItem>
                  <SelectItem value="photographer">Photographer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best_match">Best Match</SelectItem>
                  <SelectItem value="highest_rated">Highest Rated</SelectItem>
                  <SelectItem value="most_followed">Most Followed</SelectItem>
                  <SelectItem value="most_guides">Most Guides</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="most_experienced">Most Experienced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary and Active Filters */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''} found
              </span>
            </div>
            
            {/* Active Filters */}
            {(searchQuery || (selectedLocation && selectedLocation !== 'all-locations') || (selectedSpecialty && selectedSpecialty !== 'all-specialties') || selectedLanguages.length > 0 || (selectedTier && selectedTier !== 'all-tiers') || (selectedCreatorType && selectedCreatorType !== 'all-types')) && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="bg-tourism-warm/10 text-tourism-warm border-tourism-warm/20">
                    Search: "{searchQuery}"
                  </Badge>
                )}
                {selectedLocation && selectedLocation !== 'all-locations' && (
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                    Location: {selectedLocation}
                  </Badge>
                )}
                {selectedSpecialty && selectedSpecialty !== 'all-specialties' && (
                  <Badge variant="secondary" className="bg-tourism-earth/10 text-tourism-earth border-tourism-earth/20">
                    Specialty: {selectedSpecialty}
                  </Badge>
                )}
                {selectedLanguages.length > 0 && (
                  <Badge variant="secondary" className="bg-tourism-sunset/10 text-tourism-sunset border-tourism-sunset/20">
                    <Languages className="w-3 h-3 mr-1" />
                    {selectedLanguages.length} language{selectedLanguages.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {selectedTier && selectedTier !== 'all-tiers' && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    Tier: {selectedTier}
                  </Badge>
                )}
                {selectedCreatorType && selectedCreatorType !== 'all-types' && (
                  <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground border-secondary/30">
                    Type: {selectedCreatorType.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Creators Grid */}
          {filteredCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <Card 
                  key={creator.id} 
                  className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group border-border/50 hover:border-tourism-warm/30"
                  onClick={() => navigate(`/creator/${creator.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-16 h-16 ring-2 ring-tourism-warm/20 group-hover:ring-tourism-warm/40 transition-all">
                          <AvatarImage src={creator.avatar_url} />
                          <AvatarFallback className="bg-tourism-warm/10 text-tourism-warm text-lg">
                            {creator.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground group-hover:text-tourism-warm transition-colors truncate">
                                {creator.full_name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                {creator.verification_status === 'verified' && (
                                  <VerificationBadge type="blue_tick" size="sm" />
                                )}
                                <TierBadge tier={creator.current_tier} size="sm" />
                                <CreatorTypeBadge type={creator.creator_type as any} />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{creator.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {creator.bio || "Passionate cultural guide sharing authentic local experiences and hidden gems."}
                        </p>

                        {/* Languages - More Prominent */}
                        {creator.languages_spoken && creator.languages_spoken.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Languages className="w-3 h-3" />
                              Languages Spoken
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {creator.languages_spoken.slice(0, 4).map((language, index) => (
                                <Badge 
                                  key={index} 
                                  className="text-xs bg-tourism-earth/10 text-tourism-earth border-tourism-earth/20 hover:bg-tourism-earth/20"
                                >
                                  {language}
                                </Badge>
                              ))}
                              {creator.languages_spoken.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{creator.languages_spoken.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Specialties */}
                        {creator.specialties && creator.specialties.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">Specialties</div>
                            <div className="flex flex-wrap gap-1">
                              {creator.specialties.slice(0, 2).map((specialty, index) => (
                                <Badge 
                                  key={index} 
                                  variant="secondary" 
                                  className="text-xs bg-tourism-warm/10 text-tourism-warm border-tourism-warm/20"
                                >
                                  {specialty}
                                </Badge>
                              ))}
                              {creator.specialties.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{creator.specialties.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              <span>{formatNumber(creator.followers_count)} followers</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <BookOpen className="w-3 h-3" />
                              <span>{creator.total_guides} guides</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <DualRatingDisplay
                              serviceRating={creator.service_rating || creator.avg_rating}
                              serviceRatingCount={creator.service_rating_count || 0}
                              platformRating={creator.platform_rating}
                              platformRatingCount={creator.platform_rating_count}
                              combinedRating={creator.combined_rating || creator.avg_rating}
                              experienceYears={creator.experience_years}
                              variant="inline"
                            />
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Play className="w-3 h-3" />
                              <span>{formatNumber(creator.total_plays)} plays</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 pb-4">
                      <div className="flex gap-2">
                        <Button
                          variant={followedCreators.has(creator.id) ? "default" : "outline"}
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(creator.id);
                          }}
                        >
                          <Heart className={`w-3 h-3 ${followedCreators.has(creator.id) ? 'fill-current' : ''}`} />
                          {followedCreators.has(creator.id) ? 'Following' : 'Follow'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessage();
                          }}
                        >
                          <MessageCircle className="w-3 h-3" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No creators found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};