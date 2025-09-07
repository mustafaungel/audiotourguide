import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { TierProgress } from '@/components/TierProgress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Eye, 
  Edit, 
  BarChart3, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Calendar,
  Users,
  Download,
  MessageSquare,
  Award,
  Target
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Guide {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  price_usd: number;
  is_approved: boolean;
  is_published: boolean;
  rating: number;
  total_reviews: number;
  total_purchases: number;
  created_at: string;
}

export const CreatorDashboard = () => {
  const { user, userProfile } = useAuth();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [stats, setStats] = useState({
    totalGuides: 0,
    publishedGuides: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalViews: 0,
    monthlyGrowth: 0,
    followerCount: 0,
    thisMonthRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchGuides();
    }
  }, [user]);

  const fetchGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGuides(data || []);
      
      // Calculate enhanced stats
      const totalGuides = data?.length || 0;
      const publishedGuides = data?.filter(g => g.is_published && g.is_approved).length || 0;
      const totalRevenue = data?.reduce((sum, g) => sum + (g.total_purchases * g.price_usd), 0) || 0;
      const averageRating = data?.reduce((sum, g) => sum + (g.rating || 0), 0) / totalGuides || 0;
      
      // Mock additional stats (in real app, these would come from proper analytics)
      const totalViews = data?.reduce((sum, g) => sum + (g.total_purchases * 3), 0) || 0; // Estimate views
      const thisMonthRevenue = totalRevenue * 0.3; // Mock current month revenue
      const monthlyGrowth = 15.2; // Mock growth percentage
      
      setStats({
        totalGuides,
        publishedGuides,
        totalRevenue: totalRevenue / 100,
        averageRating,
        totalViews,
        monthlyGrowth,
        followerCount: 234, // Mock follower count
        thisMonthRevenue: thisMonthRevenue / 100
      });

      // Fetch recent activity
      await fetchRecentActivity();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch your guides"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Mock recent activity data (in real app, this would be from analytics/notifications)
      setRecentActivity([
        {
          type: 'purchase',
          message: 'New purchase: "Secrets of the Colosseum"',
          time: '2 hours ago',
          amount: '$29.99'
        },
        {
          type: 'review',
          message: 'New 5-star review on "Tokyo After Dark"',
          time: '5 hours ago',
          rating: 5
        },
        {
          type: 'milestone',
          message: 'Reached 1,000 total downloads!',
          time: '1 day ago'
        },
        {
          type: 'follower',
          message: '3 new followers this week',
          time: '2 days ago'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  const getStatusBadge = (guide: Guide) => {
    if (!guide.is_approved) {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    if (!guide.is_published) {
      return <Badge variant="outline">Approved, Not Published</Badge>;
    }
    return <Badge variant="default">Published</Badge>;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading your dashboard...</div>;
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid grid-cols-4 w-full max-w-md">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="guides">Guides</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-tourism-warm" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-tourism-warm">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +${stats.thisMonthRevenue.toFixed(2)} this month
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.monthlyGrowth}% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Guides</CardTitle>
              <BarChart3 className="h-4 w-4 text-tourism-earth" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-tourism-earth">{stats.publishedGuides}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalGuides} total created
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-tourism-sunset" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-tourism-sunset">{stats.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.followerCount} followers
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tier Progress */}
          <TierProgress userProfile={userProfile} showUpdateButton={true} />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/admin'}>
                <Edit className="w-4 h-4 mr-2" />
                Create New Guide
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message Followers
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Analytics</CardTitle>
            <CardDescription>Detailed insights into your content performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stats.monthlyGrowth}%</div>
                <div className="text-sm text-muted-foreground">Monthly Growth</div>
                <Progress value={stats.monthlyGrowth} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold">82%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
                <Progress value={82} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold">4.8</div>
                <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                <Progress value={96} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="guides" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Audio Guides</CardTitle>
            <CardDescription>Manage and track your published guides</CardDescription>
          </CardHeader>
          <CardContent>
            {guides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>You haven't created any guides yet.</p>
                <Button className="mt-4" onClick={() => window.location.href = '/admin'}>
                  Create Your First Guide
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {guides.map((guide) => (
                  <div key={guide.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{guide.title}</h3>
                        {getStatusBadge(guide)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{guide.location} • {guide.category}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${(guide.price_usd / 100).toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {guide.total_purchases} purchases
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {guide.rating || 0} ({guide.total_reviews} reviews)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Analytics
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="activity" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-tourism-warm rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  {activity.amount && (
                    <Badge variant="secondary" className="bg-tourism-warm/10 text-tourism-warm">
                      {activity.amount}
                    </Badge>
                  )}
                  {activity.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(activity.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-tourism-sunset text-tourism-sunset" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};