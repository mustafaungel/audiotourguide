import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { ViralGamification } from '@/components/ViralGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Headphones, 
  MapPin, 
  Trophy,
  Calendar,
  Clock,
  Star,
  Heart,
  Share2,
  Download,
  Eye,
  TrendingUp,
  Crown,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserActivity {
  id: string;
  type: 'guide_listened' | 'guide_purchased' | 'experience_booked' | 'achievement_unlocked';
  title: string;
  description: string;
  timestamp: string;
  image?: string;
  category?: string;
}

interface Recommendation {
  id: string;
  type: 'guide' | 'experience' | 'destination';
  title: string;
  location: string;
  image: string;
  rating: number;
  reason: string;
  category: string;
}

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [userStats] = useState({
    guidesListened: 24,
    hoursListened: 18.5,
    placesVisited: 12,
    achievementsUnlocked: 8,
    currentStreak: 7,
    totalPoints: 1240,
    favoriteGuides: 15,
    sharesCount: 6
  });

  const [recentActivity] = useState<UserActivity[]>([
    {
      id: '1',
      type: 'achievement_unlocked',
      title: 'Globe Trotter Achievement',
      description: 'Visited 10 different destinations',
      timestamp: '2 hours ago',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&h=100&fit=crop'
    },
    {
      id: '2',
      type: 'guide_listened',
      title: 'Secrets of the Vatican',
      description: 'Completed audio guide',
      timestamp: '1 day ago',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=100&h=100&fit=crop',
      category: 'Historical'
    },
    {
      id: '3',
      type: 'experience_booked',
      title: 'Virtual Louvre Tour',
      description: 'Booked live experience with Marie',
      timestamp: '2 days ago',
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=100&h=100&fit=crop',
      category: 'Museums'
    },
    {
      id: '4',
      type: 'guide_purchased',
      title: 'Hidden Gems of Tokyo',
      description: 'Purchased premium guide',
      timestamp: '3 days ago',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=100&h=100&fit=crop',
      category: 'Urban'
    }
  ]);

  const [recommendations] = useState<Recommendation[]>([
    {
      id: '1',
      type: 'guide',
      title: 'Ancient Mysteries of Petra',
      location: 'Jordan',
      image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d7d9d3?w=300&h=200&fit=crop',
      rating: 4.9,
      reason: 'Based on your love for historical sites',
      category: 'Historical'
    },
    {
      id: '2',
      type: 'experience',
      title: 'Live Cooking Class in Tuscany',
      location: 'Italy',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop',
      rating: 4.8,
      reason: 'Perfect for culinary enthusiasts',
      category: 'Culinary'
    },
    {
      id: '3',
      type: 'destination',
      title: 'Santorini Sunset Tours',
      location: 'Greece',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=300&h=200&fit=crop',
      rating: 4.9,
      reason: 'Trending destination this week',
      category: 'Nature'
    }
  ]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'guide_listened': return <Headphones className="h-4 w-4 text-tourism-warm" />;
      case 'guide_purchased': return <Download className="h-4 w-4 text-green-600" />;
      case 'experience_booked': return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'achievement_unlocked': return <Trophy className="h-4 w-4 text-yellow-600" />;
      default: return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!user) {
    return (
      <div className="mobile-viewport bg-background">
        <Navigation />
        <div className="mobile-container mobile-padding text-center">
          <h1 className="mobile-heading mb-4">Access Denied</h1>
          <p className="mobile-caption mb-6">Please sign in to view your dashboard.</p>
          <Button onClick={() => navigate('/auth')} className="touch-target">Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-viewport bg-background">
      <Navigation />
      
      <main className="mobile-container mobile-padding">
        {/* Dashboard Header */}
        <div className="mobile-spacing">
          <h1 className="mobile-heading sm:text-3xl text-foreground mb-2">
            Welcome back, {userProfile?.full_name || user.email}!
          </h1>
          <p className="mobile-caption">
            Track your journey, discover new places, and connect with fellow travelers.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mobile-spacing">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-card border border-border">
            <TabsTrigger value="overview" className="flex items-center gap-2 mobile-caption font-medium">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2 mobile-caption font-medium">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2 mobile-caption font-medium">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2 mobile-caption font-medium">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Discover</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mobile-spacing">
            {/* Quick Stats Grid */}
            <div className="mobile-grid gap-3 sm:gap-4">
              <Card className="mobile-padding text-center bg-gradient-card">
                <Headphones className="h-6 w-6 sm:h-8 sm:w-8 text-tourism-warm mx-auto mb-2 sm:mb-3" />
                <div className="mobile-subheading sm:text-2xl lg:text-3xl font-bold text-foreground">{userStats.guidesListened}</div>
                <div className="mobile-caption text-muted-foreground">Guides Listened</div>
              </Card>
              
              <Card className="mobile-padding text-center bg-gradient-card">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-tourism-sky mx-auto mb-2 sm:mb-3" />
                <div className="mobile-subheading sm:text-2xl lg:text-3xl font-bold text-foreground">{userStats.hoursListened}h</div>
                <div className="mobile-caption text-muted-foreground">Hours Explored</div>
              </Card>
              
              <Card className="mobile-padding text-center bg-gradient-card">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-tourism-earth mx-auto mb-2 sm:mb-3" />
                <div className="mobile-subheading sm:text-2xl lg:text-3xl font-bold text-foreground">{userStats.placesVisited}</div>
                <div className="mobile-caption text-muted-foreground">Places Visited</div>
              </Card>
              
              <Card className="mobile-padding text-center bg-gradient-card">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mx-auto mb-2 sm:mb-3" />
                <div className="mobile-subheading sm:text-2xl lg:text-3xl font-bold text-foreground">{userStats.achievementsUnlocked}</div>
                <div className="mobile-caption text-muted-foreground">Achievements</div>
              </Card>
            </div>

            {/* Level Progress */}
            <Card className="bg-gradient-tourism border-tourism-warm/20 shadow-tourism">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="h-6 w-6 text-primary-foreground" />
                    <div>
                      <CardTitle className="text-primary-foreground">Explorer Level 5</CardTitle>
                      <p className="text-primary-foreground/80">Seasoned Tourist</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                    {formatNumber(userStats.totalPoints)} pts
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-primary-foreground/80">
                    <span>Progress to Level 6</span>
                    <span>240/600 XP</span>
                  </div>
                  <Progress value={40} className="h-2 bg-primary-foreground/20" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 mobile-subheading">
                  <Clock className="h-5 w-5 text-tourism-warm" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mobile-spacing">
                  {recentActivity.slice(0, 4).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 mobile-padding rounded-lg bg-gradient-card">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      {activity.image && (
                        <img 
                          src={activity.image} 
                          alt={activity.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="mobile-text font-medium text-foreground truncate">{activity.title}</h4>
                        <p className="mobile-caption text-muted-foreground">{activity.description}</p>
                      </div>
                      <div className="mobile-caption text-muted-foreground flex-shrink-0">
                        {activity.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <ViralGamification />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {/* Detailed Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-tourism-warm" />
                  Complete Activity History
                </CardTitle>
                <p className="text-muted-foreground">
                  Your complete journey with audio guides and experiences
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-card border border-border">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{activity.title}</h4>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            {activity.category && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {activity.category}
                              </Badge>
                            )}
                          </div>
                          {activity.image && (
                            <img 
                              src={activity.image} 
                              alt={activity.title}
                              className="w-16 h-16 rounded object-cover ml-4"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>{activity.timestamp}</span>
                          {activity.type === 'guide_listened' && (
                            <Button variant="ghost" size="sm" className="h-6 px-2">
                              Listen Again
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            {/* Personalized Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  Recommended For You
                </CardTitle>
                <p className="text-muted-foreground">
                  Discover new guides and experiences based on your interests
                </p>
              </CardHeader>
              <CardContent>
                <div className="mobile-grid gap-4">
                  {recommendations.map((rec) => (
                    <Card key={rec.id} className="overflow-hidden hover:shadow-card transition-all cursor-pointer">
                      <div className="aspect-mobile relative">
                        <img 
                          src={rec.image} 
                          alt={rec.title}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-2 right-2 bg-background/90 text-foreground mobile-caption">
                          {rec.category}
                        </Badge>
                      </div>
                      <CardContent className="mobile-padding">
                        <h4 className="mobile-text font-semibold text-foreground mb-1">{rec.title}</h4>
                        <div className="flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="mobile-caption text-muted-foreground">{rec.location}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="mobile-caption">{rec.rating}</span>
                          </div>
                        </div>
                        <p className="mobile-caption text-accent mb-3">{rec.reason}</p>
                        <Button 
                          size="sm" 
                          className="w-full touch-target"
                          onClick={() => rec.type === 'guide' ? navigate(`/guide/${rec.id}`) : navigate(`/experience/${rec.id}`)}
                        >
                          {rec.type === 'guide' ? 'Listen Now' : rec.type === 'experience' ? 'Book Experience' : 'Explore'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;