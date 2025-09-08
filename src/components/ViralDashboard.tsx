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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Users Online</p>
                <p className="text-2xl font-bold">{formatNumber(viralStats.total_users_online)}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Viral Guides Today</p>
                <p className="text-2xl font-bold">{viralStats.viral_guides_today}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trending Locations</p>
                <p className="text-2xl font-bold">{viralStats.trending_locations}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Social Shares</p>
                <p className="text-2xl font-bold">{formatNumber(viralStats.social_shares)}</p>
                <Badge variant="secondary" className="mt-1">
                  {viralStats.growth_rate}
                </Badge>
              </div>
              <Share2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {liveActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{activity.user}</p>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                </div>
                <Badge variant="outline">{activity.time}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Viral Dashboard Tabs */}
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="gamification">Gamification</TabsTrigger>
          <TabsTrigger value="generator">Generator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trending">
          <TrendingContent />
        </TabsContent>
        
        <TabsContent value="creators">
          <CreatorSpotlight />
        </TabsContent>
        
        <TabsContent value="gamification">
          <ViralGamification />
        </TabsContent>
        
        <TabsContent value="generator">
          <ViralContentGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};