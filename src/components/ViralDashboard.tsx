import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingContent } from './TrendingContent';
import { CreatorSpotlight } from './CreatorSpotlight';
import { ViralGamification } from './ViralGamification';
import { ViralContentGenerator } from './ViralContentGenerator';
import { SocialShare } from './SocialShare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, TrendingUp, Users, Crown, Zap, Globe, Share2, Trophy, Star } from 'lucide-react';
interface ViralStats {
  total_users_online: number;
  viral_guides_today: number;
  trending_locations: number;
  social_shares: number;
  growth_rate: string;
}
export const ViralDashboard: React.FC = () => {
  const [viralStats] = useState<ViralStats>({
    total_users_online: 12847,
    viral_guides_today: 23,
    trending_locations: 8,
    social_shares: 3420,
    growth_rate: '+340%'
  });
  const [liveActivity] = useState([{
    user: 'Emma from NYC',
    action: 'shared "Hidden Gems of Tokyo"',
    time: '2 min ago'
  }, {
    user: 'Marcus from London',
    action: 'unlocked "Globe Trotter" achievement',
    time: '5 min ago'
  }, {
    user: 'Sofia from Barcelona',
    action: 'started trending guide in Rome',
    time: '8 min ago'
  }, {
    user: 'Raj from Mumbai',
    action: 'reached Level 10!',
    time: '12 min ago'
  }]);
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  return (
    <div className="space-y-6">
      {/* Viral Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(viralStats.total_users_online)}</div>
            <Badge variant="secondary" className="mt-1">
              <Flame className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viral Guides Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viralStats.viral_guides_today}</div>
            <Badge variant="default" className="mt-1">
              <Zap className="h-3 w-3 mr-1" />
              {viralStats.growth_rate}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trending Locations</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viralStats.trending_locations}</div>
            <Badge variant="outline" className="mt-1">
              <Crown className="h-3 w-3 mr-1" />
              Hot
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(viralStats.social_shares)}</div>
            <Badge variant="secondary" className="mt-1">
              <Trophy className="h-3 w-3 mr-1" />
              Viral
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Activity</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {liveActivity.slice(0, 2).map((activity, index) => (
                <div key={index} className="text-xs">
                  <div className="font-medium">{activity.user}</div>
                  <div className="text-muted-foreground">{activity.action}</div>
                  <div className="text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="gamification">Gamification</TabsTrigger>
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          <TrendingContent />
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          <CreatorSpotlight />
        </TabsContent>

        <TabsContent value="gamification" className="space-y-4">
          <ViralGamification />
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <ViralContentGenerator />
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <SocialShare 
            title="Viral Dashboard - Travel Guides" 
            description="Discover trending travel guides and viral content from our community"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};