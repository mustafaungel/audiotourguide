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
  const [trendingGuides, setTrendingGuides] = useState<TrendingGuide[]>([]);

  const [trendingLocations, setTrendingLocations] = useState<TrendingLocation[]>([]);

  const [viralCategories] = useState([]);

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
          <div className="text-center py-8">
            <p className="text-muted-foreground">No viral categories available</p>
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
          <div className="text-center py-8">
            <p className="text-muted-foreground">No trending guides available</p>
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
          <div className="text-center py-8">
            <p className="text-muted-foreground">No trending destinations available</p>
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