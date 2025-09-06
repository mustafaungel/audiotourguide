import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const [featuredCreators] = useState<FeaturedCreator[]>([
    {
      id: '1',
      name: 'Elena Rodriguez',
      title: 'UNESCO Heritage Expert',
      location: 'Machu Picchu, Peru',
      avatar_url: '/api/placeholder/100/100',
      followers: 15420,
      guides_count: 28,
      total_plays: 89000,
      rating: 4.9,
      specialties: ['Ancient Civilizations', 'Archaeology', 'Andean Culture'],
      recent_achievement: 'Reached 100K total plays!',
      is_verified: true,
      is_trending: true,
      bio: 'Archaeologist with 12 years of experience bringing ancient civilizations to life through immersive audio storytelling.',
      viral_guide: {
        title: 'Hidden Chambers of Machu Picchu',
        plays: 45000,
        viral_score: 98
      }
    },
    {
      id: '2',
      name: 'Marco Rossi',
      title: 'Renaissance Art Historian',
      location: 'Florence, Italy',
      avatar_url: '/api/placeholder/100/100',
      followers: 12890,
      guides_count: 35,
      total_plays: 156000,
      rating: 4.8,
      specialties: ['Renaissance Art', 'Architecture', 'Italian History'],
      recent_achievement: 'Featured in Travel + Leisure Magazine',
      is_verified: true,
      is_trending: false,
      bio: 'Passionate about making Renaissance art accessible to modern travelers through captivating narratives.',
      viral_guide: {
        title: 'Secrets of the Uffizi Gallery',
        plays: 32000,
        viral_score: 89
      }
    },
    {
      id: '3',
      name: 'Yuki Tanaka',
      title: 'Cultural Immersion Guide',
      location: 'Kyoto, Japan',
      avatar_url: '/api/placeholder/100/100',
      followers: 18750,
      guides_count: 22,
      total_plays: 78000,
      rating: 4.9,
      specialties: ['Traditional Culture', 'Tea Ceremony', 'Temple Architecture'],
      recent_achievement: 'Most-shared guide of the week',
      is_verified: true,
      is_trending: true,
      bio: 'Connecting travelers with authentic Japanese culture through centuries-old traditions and hidden local gems.',
      viral_guide: {
        title: 'Secret Geisha Districts of Kyoto',
        plays: 38000,
        viral_score: 94
      }
    }
  ]);

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
      <div className="space-y-6">
        {featuredCreators.map((creator) => (
          <Card key={creator.id} className="bg-gradient-card border-tourism-warm/20 shadow-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Creator Profile */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-2 border-tourism-warm">
                      <AvatarImage src={creator.avatar_url} alt={creator.name} />
                      <AvatarFallback className="bg-tourism-warm text-primary-foreground font-bold">
                        {creator.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {creator.is_verified && (
                      <div className="absolute -bottom-1 -right-1 bg-tourism-warm rounded-full p-1">
                        <Verified className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-foreground">{creator.name}</h3>
                      {creator.is_trending && (
                        <Badge className="bg-red-500 text-white animate-pulse">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          VIRAL
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-tourism-warm font-medium mb-1">{creator.title}</p>
                    
                    <div className="flex items-center gap-1 text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      {creator.location}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {creator.bio}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {creator.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="lg:min-w-[280px]">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 mb-4">
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-tourism-sky" />
                        <span className="text-sm text-muted-foreground">Followers</span>
                      </div>
                      <span className="font-bold text-foreground">{formatNumber(creator.followers)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-tourism-earth" />
                        <span className="text-sm text-muted-foreground">Total Plays</span>
                      </div>
                      <span className="font-bold text-foreground">{formatNumber(creator.total_plays)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">Rating</span>
                      </div>
                      <span className="font-bold text-foreground">{creator.rating}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-tourism-warm" />
                        <span className="text-sm text-muted-foreground">Guides</span>
                      </div>
                      <span className="font-bold text-foreground">{creator.guides_count}</span>
                    </div>
                  </div>

                  {/* Viral Guide Highlight */}
                  {creator.viral_guide && (
                    <div className="p-3 bg-gradient-tourism/10 border border-tourism-warm/20 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-tourism-warm">Viral Guide</span>
                      </div>
                      <h4 className="font-medium text-foreground mb-1">{creator.viral_guide.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatNumber(creator.viral_guide.plays)} plays</span>
                        <Badge className="bg-red-500 text-white">
                          {creator.viral_guide.viral_score}% viral score
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Recent Achievement */}
                  <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium text-accent">Recent Achievement</span>
                    </div>
                    <p className="text-sm text-foreground">{creator.recent_achievement}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleFollow(creator.id)}
                      className={`flex-1 ${
                        followedCreators.has(creator.id)
                          ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                          : 'bg-tourism-warm hover:bg-tourism-warm/90 text-primary-foreground'
                      }`}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {followedCreators.has(creator.id) ? 'Following' : 'Follow'}
                    </Button>
                    
                    <Button variant="outline" size="icon">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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