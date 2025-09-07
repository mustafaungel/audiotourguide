import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Users, Sparkles, ChevronRight } from 'lucide-react';
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

      if (!profilesData || profilesData.length === 0) {
        setCreators([]);
        return;
      }

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
      const processedCreators = profilesData.map(profile => {
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

      // Sort by relevance (connected users last, then by rating and guides)
      const sortedCreators = processedCreators
        .filter(c => c.totalGuides > 0) // Only show creators with published guides
        .sort((a, b) => {
          // Prioritize unconnected creators
          if (a.isConnected !== b.isConnected) {
            return a.isConnected ? 1 : -1;
          }
          // Then by rating and guide count
          return (b.avgRating * b.totalGuides) - (a.avgRating * a.totalGuides);
        });

      setCreators(sortedCreators);

    } catch (error) {
      console.error('Error fetching recommended creators:', error);
      setCreators([]);
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

  if (creators.length === 0) {
    return null; // Don't show empty state
  }

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
          {creators.slice(0, limit).map((creator) => (
            <div
              key={creator.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
              onClick={() => handleCreatorClick(creator.id)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={creator.avatar_url} />
                <AvatarFallback>{creator.full_name.charAt(0)}</AvatarFallback>
              </Avatar>

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
          ))}
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