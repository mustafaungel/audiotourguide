import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreatorTypeBadge } from '@/components/CreatorTypeBadge';
import { CreatorRecommendations } from '@/components/CreatorRecommendations';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Users, 
  Play, 
  UserPlus,
  Crown,
  Verified,
  TrendingUp,
  Heart,
  Share2,
  MessageCircle
} from 'lucide-react';

interface FeaturedCreator {
  id: string;
  name: string;
  title: string;
  location: string;
  avatar_url: string;
  creator_type: 'influencer' | 'local_guide' | 'expert';
  followers: number;
  guides_count: number;
  total_plays: number;
  rating: number;
  specialties: string[];
  recent_achievement: string;
  is_verified: boolean;
  is_trending: boolean;
  bio: string;
  viral_guide?: {
    title: string;
    plays: number;
    viral_score: number;
  };
}

export const CreatorSpotlight: React.FC = () => {
  const navigate = useNavigate();
  
  const [featuredCreators] = useState<FeaturedCreator[]>([]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const [followedCreators, setFollowedCreators] = useState<Set<string>>(new Set());

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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-primary border-none shadow-tourism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary-foreground">
            <Crown className="h-6 w-6" />
            Creator Spotlight
          </CardTitle>
          <p className="text-primary-foreground/80">
            Meet the storytellers creating viral content and inspiring millions of travelers
          </p>
        </CardHeader>
      </Card>

      {/* Featured Creators */}
      <div className="text-center py-12">
        <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">No featured creators available</p>
      </div>

      {/* Creator Program CTA */}
      <Card className="bg-gradient-accent border-accent/20">
        <CardContent className="p-6 text-center">
          <Crown className="h-12 w-12 text-accent-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-accent-foreground mb-2">
            Become a Featured Creator
          </h3>
          <p className="text-accent-foreground/80 mb-4">
            Join our viral creator program and reach millions of travelers worldwide
          </p>
          <Button className="bg-accent-foreground text-accent hover:bg-accent-foreground/90">
            Apply to Creator Program
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};