import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { TrendingContent } from '@/components/TrendingContent';
import { CreatorSpotlight } from '@/components/CreatorSpotlight';
import { SocialShare } from '@/components/SocialShare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Crown,
  Flame,
  Globe,
  Heart,
  Share2,
  MapPin,
  Clock,
  Star
} from 'lucide-react';

interface CommunityPost {
  id: string;
  user: {
    name: string;
    avatar: string;
    level: string;
    verified: boolean;
  };
  content: string;
  image?: string;
  location?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  liked?: boolean;
}

const Community = () => {
  const [activeTab, setActiveTab] = useState('trending');
  const [communityStats] = useState({
    totalMembers: 45680,
    activeToday: 2340,
    postsToday: 156,
    countriesRepresented: 89
  });

  const [communityPosts] = useState<CommunityPost[]>([
    {
      id: '1',
      user: {
        name: 'Sarah Explorer',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b639?w=100&h=100&fit=crop&crop=face',
        level: 'Master Explorer',
        verified: true
      },
      content: "Just discovered this incredible hidden temple in Kyoto! The audio guide revealed stories I never would have known. The connection between ancient rituals and modern practices is fascinating. 🏯✨",
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop',
      location: 'Kyoto, Japan',
      timestamp: '2 hours ago',
      likes: 234,
      comments: 18,
      shares: 45,
      liked: true
    },
    {
      id: '2',
      user: {
        name: 'Marco Adventures',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        level: 'Globe Trotter',
        verified: false
      },
      content: "The street food audio tour in Bangkok completely changed my perspective! Learning about the history behind each dish made every bite more meaningful. Already planning my next culinary adventure! 🍜🌶️",
      location: 'Bangkok, Thailand',
      timestamp: '4 hours ago',
      likes: 189,
      comments: 22,
      shares: 31
    },
    {
      id: '3',
      user: {
        name: 'Elena Wanderlust',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
        level: 'Cultural Ambassador',
        verified: true
      },
      content: "Sharing my favorite moments from the Santorini sunset audio guide. The stories about ancient civilizations while watching the sun dip into the Aegean Sea... pure magic! ✨🌅",
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop',
      location: 'Santorini, Greece',
      timestamp: '6 hours ago',
      likes: 312,
      comments: 28,
      shares: 67,
      liked: true
    }
  ]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const toggleLike = (postId: string) => {
    // Toggle like functionality would be implemented here
    console.log('Toggle like for post:', postId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Community Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-tourism bg-clip-text text-transparent mb-4">
            Travel Community Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with fellow travelers, share discoveries, and be part of the global community 
            exploring the world through immersive audio stories.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <Card className="p-4 sm:p-6 text-center bg-gradient-card">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-tourism-warm" />
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{formatNumber(communityStats.totalMembers)}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Members</div>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6 text-center bg-gradient-card">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{formatNumber(communityStats.activeToday)}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Active Today</div>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6 text-center bg-gradient-card">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-tourism-sky" />
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{communityStats.postsToday}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Posts Today</div>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6 text-center bg-gradient-card">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-tourism-earth" />
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{communityStats.countriesRepresented}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Countries</div>
            </div>
          </Card>
        </div>

        {/* Community Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="creators" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-6">
            <TrendingContent />
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            {/* Community Posts Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-tourism-warm" />
                  Community Feed
                </CardTitle>
                <p className="text-muted-foreground">
                  See what fellow travelers are discovering around the world
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {communityPosts.map((post) => (
                    <div key={post.id} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
                      {/* Post Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.user.avatar} alt={post.user.name} />
                          <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{post.user.name}</h4>
                            {post.user.verified && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">✓ Verified</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{post.user.level}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {post.location && (
                              <>
                                <MapPin className="h-3 w-3" />
                                <span>{post.location}</span>
                                <span>•</span>
                              </>
                            )}
                            <Clock className="h-3 w-3" />
                            <span>{post.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <p className="text-foreground mb-3 text-base leading-relaxed">{post.content}</p>
                        {post.image && (
                          <img 
                            src={post.image} 
                            alt="Post content" 
                            className="w-full rounded-lg object-cover max-h-80 sm:max-h-96"
                          />
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4 sm:gap-6">
                          <button 
                            onClick={() => toggleLike(post.id)}
                            className={`flex items-center gap-2 transition-colors min-h-[44px] touch-manipulation ${
                              post.liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                            }`}
                          >
                            <Heart className={`h-5 w-5 ${post.liked ? 'fill-current' : ''}`} />
                            <span className="text-sm sm:text-base">{formatNumber(post.likes)}</span>
                          </button>
                          
                          <button className="flex items-center gap-2 text-muted-foreground hover:text-tourism-sky transition-colors min-h-[44px] touch-manipulation">
                            <MessageSquare className="h-5 w-5" />
                            <span className="text-sm sm:text-base">{post.comments}</span>
                          </button>
                          
                          <button className="flex items-center gap-2 text-muted-foreground hover:text-tourism-earth transition-colors min-h-[44px] touch-manipulation">
                            <Share2 className="h-5 w-5" />
                            <span className="text-sm sm:text-base">{post.shares}</span>
                          </button>
                        </div>
                        
                        <Button variant="ghost" size="sm" className="text-tourism-warm hover:bg-tourism-warm/10 min-h-[44px] touch-manipulation">
                          View Guide
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creators" className="space-y-6">
            <CreatorSpotlight />
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            {/* Social Sharing Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-tourism-warm" />
                  Share Your Journey
                </CardTitle>
                <p className="text-muted-foreground">
                  Inspire others by sharing your favorite audio guide discoveries
                </p>
              </CardHeader>
              <CardContent>
                <SocialShare
                  title="🌍 Discover the World Through Audio Stories!"
                  description="Join our community of explorers discovering amazing destinations through immersive audio guides. From hidden gems to world-famous landmarks!"
                  guide={{
                    id: 'community',
                    title: 'Travel Community Hub',
                    location: 'Worldwide',
                    image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop'
                  }}
                />
              </CardContent>
            </Card>

            {/* Discovery Challenges */}
            <Card className="border-accent/20 bg-gradient-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent" />
                  Weekly Discovery Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-background/50 rounded-lg border border-accent/20">
                    <h4 className="font-semibold text-foreground mb-2">📍 Find Your City's Hidden Gem</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Discover a lesser-known spot in your city and share it with the community. 
                      Tag us with #HiddenGemChallenge for a chance to be featured!
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-accent text-accent-foreground">5 days left</Badge>
                      <Button size="sm" className="bg-accent hover:bg-accent/90">
                        Join Challenge
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Community;