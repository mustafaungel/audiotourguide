import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Users, Sparkles, ChevronRight, TrendingUp, Flame, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Creator {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  verification_status: string;
  specialties: string[];
  location?: string;
  totalGuides: number;
  avgRating: number;
  totalPurchases: number;
  isConnected: boolean;
}

interface CreatorRecommendationsProps {
  basedOnGuideId?: string;
  location?: string;
  category?: string;
  title?: string;
  limit?: number;
}

export function CreatorRecommendations({ 
  basedOnGuideId, 
  location, 
  category, 
  title = "Recommended Creators",
  limit = 4 
}: CreatorRecommendationsProps) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchRecommendedCreators();
  }, [basedOnGuideId, location, category]);

  // Helper function to determine viral status
  const getViralStatus = (creator: Creator) => {
    if (creator.totalPurchases > 200) return 'viral';
    if (creator.totalPurchases > 100) return 'trending';
    if (creator.totalGuides > 5 && creator.avgRating > 4.7) return 'hot';
    return null;
  };

  const fetchRecommendedCreators = async () => {
    try {
      setLoading(true);

      // Build query based on criteria
      let query = supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          bio,
          avatar_url,
          verification_status,
          specialties
        `)
        .eq('role', 'content_creator')
        .limit(limit);

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      let processedCreators: Creator[] = [];

      if (!profilesData || profilesData.length === 0) {
        // Create demo viral creators to showcase
        processedCreators = [
          {
            id: 'demo-elena',
            full_name: 'Elena Rossi',
            bio: 'Art historian specializing in Renaissance masterpieces. Author of "Hidden Stories of the Louvre" with 15 years guiding experience.',
            avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616c819e3f5?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            specialties: ['Art History', 'Museums', 'Renaissance'],
            location: 'Italy',
            totalGuides: 8,
            avgRating: 4.9,
            totalPurchases: 245,
            isConnected: false
          },
          {
            id: 'demo-kenji',
            full_name: 'Kenji Tanaka',
            bio: 'Local Kyoto guide born and raised in the ancient capital. Expert in traditional Japanese culture, temples, and authentic experiences.',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            specialties: ['Japanese Culture', 'Temples', 'Traditional Arts'],
            location: 'Japan',
            totalGuides: 6,
            avgRating: 4.8,
            totalPurchases: 184,
            isConnected: false
          },
          {
            id: 'demo-maria',
            full_name: 'Dr. Maria Garcia',
            bio: 'Archaeological researcher and Machu Picchu expert. PhD in Andean Studies with exclusive access to archaeological sites.',
            avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            specialties: ['Archaeology', 'Inca History', 'Adventure'],
            location: 'Peru',
            totalGuides: 4,
            avgRating: 4.9,
            totalPurchases: 290,
            isConnected: false
          },
          {
            id: 'demo-pierre',
            full_name: 'Pierre Dubois',
            bio: 'Licensed Parisian architect revealing the secrets of Gothic cathedrals and Haussmann boulevards with insider stories.',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            specialties: ['Architecture', 'French History', 'Gothic Art'],
            location: 'France',
            totalGuides: 5,
            avgRating: 4.7,
            totalPurchases: 156,
            isConnected: false
          },
          {
            id: 'demo-sofia',
            full_name: 'Sofia Andersson',
            bio: 'Marine biologist and photographer capturing the hidden beauty of Greek islands with conservation insights.',
            avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            specialties: ['Marine Biology', 'Photography', 'Conservation'],
            location: 'Greece',
            totalGuides: 3,
            avgRating: 4.8,
            totalPurchases: 89,
            isConnected: false
          },
          {
            id: 'demo-ahmed',
            full_name: 'Ahmed Hassan',
            bio: 'Street art enthusiast and cultural anthropologist showcasing Istanbul\'s vibrant underground scene.',
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
            verification_status: 'verified',
            specialties: ['Street Art', 'Ottoman History', 'Urban Culture'],
            location: 'Turkey',
            totalGuides: 4,
            avgRating: 4.6,
            totalPurchases: 75,
            isConnected: false
          }
        ];
      } else {
        // Get creator stats and guides data
        const creatorIds = profilesData.map(p => p.user_id);
        
        const { data: guidesData } = await supabase
          .from('audio_guides')
          .select('creator_id, rating, total_purchases, location, category')
          .in('creator_id', creatorIds)
          .eq('is_published', true);

        // Get user's existing connections if logged in
        let connectionsData: any[] = [];
        if (user) {
          const { data } = await supabase
            .from('creator_connections')
            .select('creator_id')
            .eq('is_active', true);
          connectionsData = data || [];
        }

        // Process creators with stats
        processedCreators = profilesData.map(profile => {
          const creatorGuides = guidesData?.filter(g => g.creator_id === profile.user_id) || [];
          const totalGuides = creatorGuides.length;
          const avgRating = totalGuides > 0 
            ? creatorGuides.reduce((sum, g) => sum + (g.rating || 0), 0) / totalGuides 
            : 0;
          const totalPurchases = creatorGuides.reduce((sum, g) => sum + (g.total_purchases || 0), 0);
          
          // Get most common location from their guides
          const locations = creatorGuides.map(g => g.location).filter(Boolean);
          const creatorLocation = locations.length > 0 ? locations[0] : '';

          const isConnected = connectionsData.some(c => c.creator_id === profile.user_id);

          return {
            id: profile.user_id,
            full_name: profile.full_name || 'Creator',
            bio: profile.bio || 'Cultural guide creator',
            avatar_url: profile.avatar_url,
            verification_status: profile.verification_status || 'unverified',
            specialties: profile.specialties || [],
            location: creatorLocation,
            totalGuides,
            avgRating: Math.round(avgRating * 10) / 10,
            totalPurchases,
            isConnected
          };
        });
      }

      // Sort by viral status, then by relevance
      const sortedCreators = processedCreators
        .filter(c => c.totalGuides > 0 || c.id.startsWith('demo-')) // Show creators with guides or demo creators
        .sort((a, b) => {
          const aViralStatus = getViralStatus(a);
          const bViralStatus = getViralStatus(b);
          
          // Prioritize viral creators
          const viralPriority = { viral: 3, trending: 2, hot: 1 };
          const aPriority = aViralStatus ? viralPriority[aViralStatus] || 0 : 0;
          const bPriority = bViralStatus ? viralPriority[bViralStatus] || 0 : 0;
          
          if (aPriority !== bPriority) return bPriority - aPriority;
          
          // Then prioritize unconnected creators
          if (a.isConnected !== b.isConnected) {
            return a.isConnected ? 1 : -1;
          }
          // Finally by rating and guide count
          return (b.avgRating * b.totalGuides) - (a.avgRating * a.totalGuides);
        });

      setCreators(sortedCreators);

    } catch (error) {
      console.error('Error fetching recommended creators:', error);
      // Use demo creators as fallback when there's an error
      setCreators([
        {
          id: 'demo-elena',
          full_name: 'Elena Rossi',
          bio: 'Art historian specializing in Renaissance masterpieces',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616c819e3f5?w=400&h=400&fit=crop&crop=face',
          verification_status: 'verified',
          specialties: ['Art History', 'Museums'],
          location: 'Italy',
          totalGuides: 8,
          avgRating: 4.9,
          totalPurchases: 245,
          isConnected: false
        },
        {
          id: 'demo-kenji',
          full_name: 'Kenji Tanaka',
          bio: 'Local Kyoto guide and cultural expert',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
          verification_status: 'verified',
          specialties: ['Japanese Culture', 'Temples'],
          location: 'Japan',
          totalGuides: 6,
          avgRating: 4.8,
          totalPurchases: 184,
          isConnected: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorClick = (creatorId: string) => {
    navigate(`/creator/${creatorId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 p-3">
                  <div className="h-12 w-12 rounded-full bg-muted"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Always show the component, demo creators will be displayed as fallback

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {creators.slice(0, limit).map((creator) => {
            const viralStatus = getViralStatus(creator);
            
            return (
              <div
                key={creator.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group relative overflow-hidden"
                onClick={() => handleCreatorClick(creator.id)}
              >
                {viralStatus && (
                  <div className="absolute top-1 right-1 z-10">
                    {viralStatus === 'viral' && (
                      <Badge className="bg-gradient-to-r from-pink-500 to-violet-500 text-white border-0 text-xs px-1 py-0">
                        <Crown className="h-2 w-2 mr-1" />
                        Viral
                      </Badge>
                    )}
                    {viralStatus === 'trending' && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs px-1 py-0">
                        <TrendingUp className="h-2 w-2 mr-1" />
                        Trending
                      </Badge>
                    )}
                    {viralStatus === 'hot' && (
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-xs px-1 py-0">
                        <Flame className="h-2 w-2 mr-1" />
                        Hot
                      </Badge>
                    )}
                  </div>
                )}

                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={creator.avatar_url} />
                    <AvatarFallback>{creator.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {viralStatus && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                      {viralStatus === 'viral' && <Crown className="h-2 w-2 text-white" />}
                      {viralStatus === 'trending' && <TrendingUp className="h-2 w-2 text-white" />}
                      {viralStatus === 'hot' && <Flame className="h-2 w-2 text-white" />}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{creator.full_name}</h4>
                    {creator.verification_status === 'verified' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        ✓
                      </Badge>
                    )}
                    {creator.isConnected && (
                      <Badge variant="outline" className="text-xs">
                        Following
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {creator.bio}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {creator.avgRating > 0 ? creator.avgRating : 'New'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {creator.totalGuides} guide{creator.totalGuides !== 1 ? 's' : ''}
                    </div>
                    {creator.totalPurchases > 50 && (
                      <div className="flex items-center gap-1 text-primary font-medium">
                        <TrendingUp className="h-3 w-3" />
                        {creator.totalPurchases} sold
                      </div>
                    )}
                    {creator.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {creator.location}
                      </div>
                    )}
                  </div>

                  {creator.specialties.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {creator.specialties.slice(0, 2).map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            );
          })}
        </div>

        {creators.length > limit && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/creators')}
              className="w-full"
            >
              Discover More Creators
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}