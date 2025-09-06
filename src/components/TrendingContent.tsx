import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Flame, 
  MapPin, 
  Eye, 
  Clock, 
  Users,
  Star,
  Share2,
  Play
} from 'lucide-react';

interface TrendingGuide {
  id: string;
  title: string;
  location: string;
  views: number;
  shares: number;
  rating: number;
  duration: string;
  image_url: string;
  trending_score: number;
  category: string;
  listeners_count: number;
  created_at: string;
}

interface TrendingLocation {
  name: string;
  country: string;
  guides_count: number;
  total_views: number;
  growth_percentage: number;
  trending_rank: number;
}

export const TrendingContent: React.FC = () => {
  const [trendingGuides, setTrendingGuides] = useState<TrendingGuide[]>([
    {
      id: '1',
      title: 'Viral TikTok Spots in Rome',
      location: 'Rome, Italy',
      views: 15420,
      shares: 892,
      rating: 4.9,
      duration: '25 min',
      image_url: '/api/placeholder/300/200',
      trending_score: 98,
      category: 'Viral Spots',
      listeners_count: 3420,
      created_at: '2024-01-15'
    },
    {
      id: '2',
      title: 'Instagram-Famous Cherry Blossoms',
      location: 'Kyoto, Japan',
      views: 12890,
      shares: 756,
      rating: 4.8,
      duration: '18 min',
      image_url: '/api/placeholder/300/200',
      trending_score: 94,
      category: 'Nature & Seasons',
      listeners_count: 2890,
      created_at: '2024-01-10'
    },
    {
      id: '3',
      title: 'Celebrity Chef Street Food Tour',
      location: 'Bangkok, Thailand',
      views: 11250,
      shares: 634,
      rating: 4.7,
      duration: '32 min',
      image_url: '/api/placeholder/300/200',
      trending_score: 91,
      category: 'Food & Culture',
      listeners_count: 2450,
      created_at: '2024-01-08'
    }
  ]);

  const [trendingLocations, setTrendingLocations] = useState<TrendingLocation[]>([
    { name: 'Santorini', country: 'Greece', guides_count: 15, total_views: 45000, growth_percentage: 340, trending_rank: 1 },
    { name: 'Dubai', country: 'UAE', guides_count: 22, total_views: 38000, growth_percentage: 280, trending_rank: 2 },
    { name: 'Bali', country: 'Indonesia', guides_count: 18, total_views: 35000, growth_percentage: 225, trending_rank: 3 },
    { name: 'Reykjavik', country: 'Iceland', guides_count: 12, total_views: 28000, growth_percentage: 190, trending_rank: 4 },
    { name: 'Marrakech', country: 'Morocco', guides_count: 14, total_views: 24000, growth_percentage: 165, trending_rank: 5 }
  ]);

  const [viralCategories] = useState([
    { name: 'TikTok Famous Spots', count: 45, growth: '+420%' },
    { name: 'Instagram Backdrops', count: 38, growth: '+315%' },
    { name: 'Celebrity Locations', count: 29, growth: '+280%' },
    { name: 'Movie Film Sites', count: 52, growth: '+245%' },
    { name: 'Viral Food Spots', count: 34, growth: '+220%' }
  ]);

  const getTrendingBadge = (score: number) => {
    if (score >= 95) return { text: 'VIRAL', color: 'bg-red-500 text-white animate-pulse' };
    if (score >= 90) return { text: 'HOT', color: 'bg-orange-500 text-white' };
    if (score >= 80) return { text: 'TRENDING', color: 'bg-yellow-500 text-black' };
    return { text: 'RISING', color: 'bg-blue-500 text-white' };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    // Simulate real-time trending updates
    const interval = setInterval(() => {
      setTrendingGuides(prev => prev.map(guide => ({
        ...guide,
        views: guide.views + Math.floor(Math.random() * 50),
        shares: guide.shares + Math.floor(Math.random() * 5)
      })));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Trending Header */}
      <Card className="bg-gradient-primary border-none shadow-tourism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary-foreground">
            <Flame className="h-6 w-6 animate-pulse" />
            What's Going Viral Right Now
          </CardTitle>
          <p className="text-primary-foreground/80">
            Discover the hottest destinations trending across social media
          </p>
        </CardHeader>
      </Card>

      {/* Viral Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-tourism-warm" />
            Viral Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {viralCategories.map((category, index) => (
              <div
                key={category.name}
                className="p-4 rounded-lg bg-gradient-card border border-tourism-warm/20 hover:shadow-tourism transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-foreground">{category.name}</h4>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {category.growth}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{category.count} guides</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending Guides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-500" />
            Trending Audio Guides
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            The most shared and listened-to guides in the last 24 hours
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendingGuides.map((guide, index) => {
              const badge = getTrendingBadge(guide.trending_score);
              return (
                <div
                  key={guide.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gradient-card border border-border hover:shadow-card transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-tourism-warm min-w-[40px]">
                      #{index + 1}
                    </div>
                    <img
                      src={guide.image_url}
                      alt={guide.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{guide.title}</h4>
                      <Badge className={badge.color}>{badge.text}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {guide.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {guide.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {guide.rating}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-tourism-sky">
                        <Eye className="h-3 w-3" />
                        {formatNumber(guide.views)} views
                      </div>
                      <div className="flex items-center gap-1 text-tourism-earth">
                        <Share2 className="h-3 w-3" />
                        {formatNumber(guide.shares)} shares
                      </div>
                      <div className="flex items-center gap-1 text-accent">
                        <Users className="h-3 w-3" />
                        {formatNumber(guide.listeners_count)} listeners
                      </div>
                      <span className="text-muted-foreground">
                        {getDaysAgo(guide.created_at)} days ago
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button size="sm" className="bg-tourism-warm hover:bg-tourism-warm/90">
                      <Play className="h-4 w-4 mr-1" />
                      Listen
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trending Destinations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-tourism-earth" />
            Hottest Destinations
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Cities experiencing explosive growth in travel interest
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingLocations.map((location) => (
              <Card
                key={location.name}
                className="p-4 bg-gradient-card border-tourism-warm/20 hover:shadow-tourism transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{location.name}</h4>
                    <p className="text-sm text-muted-foreground">{location.country}</p>
                  </div>
                  <Badge className="bg-gradient-tourism text-primary-foreground">
                    #{location.trending_rank}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Growth:</span>
                    <span className="font-bold text-green-600">+{location.growth_percentage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Guides:</span>
                    <span className="text-foreground">{location.guides_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Views:</span>
                    <span className="text-foreground">{formatNumber(location.total_views)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Updates */}
      <Card className="border-accent/20 bg-gradient-accent/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-accent">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Live Updates</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tracking viral content across social media platforms in real-time
          </p>
        </CardContent>
      </Card>
    </div>
  );
};