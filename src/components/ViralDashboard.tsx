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
import { 
  Flame, 
  TrendingUp, 
  Users, 
  Crown,
  Zap,
  Globe,
  Share2,
  Trophy,
  Star
} from 'lucide-react';

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

  const [liveActivity] = useState([
    { user: 'Emma from NYC', action: 'shared "Hidden Gems of Tokyo"', time: '2 min ago' },
    { user: 'Marcus from London', action: 'unlocked "Globe Trotter" achievement', time: '5 min ago' },
    { user: 'Sofia from Barcelona', action: 'started trending guide in Rome', time: '8 min ago' },
    { user: 'Raj from Mumbai', action: 'reached Level 10!', time: '12 min ago' }
  ]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Mobile-Optimized Viral Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-primary border-none shadow-tourism">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary-foreground">
              {formatNumber(viralStats.total_users_online)}
            </div>
            <div className="text-xs sm:text-sm text-primary-foreground/80">Users Online</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent border-none shadow-accent-glow">
          <CardContent className="p-3 sm:p-4 text-center">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground mx-auto mb-1 sm:mb-2 animate-pulse" />
            <div className="text-xl sm:text-2xl font-bold text-accent-foreground">
              {viralStats.viral_guides_today}
            </div>
            <div className="text-xs sm:text-sm text-accent-foreground/80">Viral Today</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-tourism border-none shadow-tourism">
          <CardContent className="p-3 sm:p-4 text-center">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground mx-auto mb-1 sm:mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-primary-foreground">
              {viralStats.trending_locations}
            </div>
            <div className="text-xs sm:text-sm text-primary-foreground/80">Trending</div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-Optimized Live Activity Feed */}
      <Card className="border-accent/20 bg-gradient-accent/5">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-none overflow-y-auto">
            {liveActivity.slice(0, 3).map((activity, index) => (
              <div key={index} className="flex items-start justify-between p-2 sm:p-3 bg-background/50 rounded-lg">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-2 h-2 bg-accent rounded-full mt-1 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm leading-relaxed">
                    <span className="font-medium text-foreground block sm:inline">{activity.user}</span>
                    <span className="text-muted-foreground"> {activity.action}</span>
                  </span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile-Optimized Tabs */}
      <Tabs defaultValue="trending" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border h-12 sm:h-10">
          <TabsTrigger value="trending" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Flame className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Trending</span>
          </TabsTrigger>
          <TabsTrigger value="creators" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Creators</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Awards</span>
          </TabsTrigger>
          <TabsTrigger value="viral-tools" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Tools</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-6">
          <TrendingContent />
        </TabsContent>

        <TabsContent value="creators" className="space-y-6">
          <CreatorSpotlight />
          {/* Move Featured Creators from main page to here */}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <ViralGamification />
        </TabsContent>

        <TabsContent value="viral-tools" className="space-y-6">
          <div className="grid gap-6">
            {/* Social Sharing Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-tourism-warm" />
                  Viral Sharing Tools
                </CardTitle>
                <p className="text-muted-foreground">
                  Share amazing destinations and go viral across social media
                </p>
              </CardHeader>
              <CardContent>
                <SocialShare
                  title="🌟 Discover Hidden Gems with Audio Tour Guides!"
                  description="Join millions exploring the world's most amazing destinations through immersive audio stories. From viral TikTok spots to UNESCO World Heritage sites!"
                  guide={{
                    id: 'sample',
                    title: 'Viral Destinations Collection',
                    location: 'Worldwide',
                    image_url: '/api/placeholder/300/200'
                  }}
                />
              </CardContent>
            </Card>

            {/* Viral Challenge Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Flame className="h-5 w-5" />
                    Weekly Viral Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-2">Share Your Hidden Gem</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Find and share the most unique spot in your city for a chance to win a year of premium access!
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500 text-white">2 days left</Badge>
                    <Button size="sm" className="bg-red-500 hover:bg-red-600">
                      Join Challenge
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Star className="h-5 w-5" />
                    Creator Spotlight Contest
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-2">Become Featured Creator</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create the most engaging audio guide this month and get featured on our homepage!
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500 text-white">15 days left</Badge>
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                      Start Creating
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Viral Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Viral Content Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">📸 Content That Goes Viral</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Behind-the-scenes stories</li>
                      <li>• Unexpected historical facts</li>
                      <li>• Local secrets & hidden gems</li>
                      <li>• Celebrity connection spots</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">🚀 Boost Your Reach</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Share on multiple platforms</li>
                      <li>• Use trending hashtags</li>
                      <li>• Collaborate with other creators</li>
                      <li>• Post during peak hours</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};