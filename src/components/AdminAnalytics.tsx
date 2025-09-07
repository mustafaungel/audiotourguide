import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText, 
  Star,
  Crown,
  Award,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalGuides: number;
  totalCreators: number;
  totalUsers: number;
  totalRevenue: number;
  topSellingGuides: Array<{
    id: string;
    title: string;
    creator_name: string;
    total_purchases: number;
    revenue: number;
    category: string;
  }>;
  topCreators: Array<{
    id: string;
    name: string;
    total_guides: number;
    total_sales: number;
    avg_rating: number;
    tier: string;
  }>;
  categoryStats: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  monthlyStats: Array<{
    month: string;
    guides: number;
    revenue: number;
    users: number;
  }>;
}

export const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch basic counts
      const [guidesResult, creatorsResult, usersResult] = await Promise.all([
        supabase.from('audio_guides').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'content_creator'),
        supabase.from('profiles').select('id', { count: 'exact' })
      ]);

      // Fetch top selling guides
      const { data: topGuides } = await supabase
        .from('audio_guides')
        .select(`
          id,
          title,
          total_purchases,
          price_usd,
          category,
          profiles!audio_guides_creator_id_fkey(full_name)
        `)
        .eq('is_published', true)
        .order('total_purchases', { ascending: false })
        .limit(10);

      // Fetch top creators
      const { data: topCreatorsData } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          current_tier,
          service_rating
        `)
        .eq('role', 'content_creator')
        .limit(10);

      // Get creator stats
      const topCreators = await Promise.all(
        (topCreatorsData || []).map(async (creator) => {
          const { data: guides } = await supabase
            .from('audio_guides')
            .select('total_purchases, price_usd')
            .eq('creator_id', creator.user_id)
            .eq('is_published', true);

          const totalGuides = guides?.length || 0;
          const totalSales = guides?.reduce((sum, guide) => sum + (guide.total_purchases || 0), 0) || 0;

          return {
            id: creator.user_id,
            name: creator.full_name || 'Unknown',
            total_guides: totalGuides,
            total_sales: totalSales,
            avg_rating: creator.service_rating || 0,
            tier: creator.current_tier || 'bronze'
          };
        })
      );

      // Fetch category statistics
      const { data: categoryData } = await supabase
        .from('audio_guides')
        .select('category, total_purchases, price_usd')
        .eq('is_published', true);

      const categoryStats = categoryData?.reduce((acc: any[], guide) => {
        const existing = acc.find(item => item.category === guide.category);
        const revenue = (guide.total_purchases || 0) * (guide.price_usd || 0);
        
        if (existing) {
          existing.count += 1;
          existing.revenue += revenue;
        } else {
          acc.push({
            category: guide.category,
            count: 1,
            revenue: revenue
          });
        }
        return acc;
      }, []) || [];

      // Calculate total revenue
      const totalRevenue = categoryData?.reduce((sum, guide) => 
        sum + ((guide.total_purchases || 0) * (guide.price_usd || 0)), 0) || 0;

      // Format top selling guides
      const formattedTopGuides = (topGuides || []).map(guide => ({
        id: guide.id,
        title: guide.title,
        creator_name: (guide.profiles as any)?.full_name || 'Unknown',
        total_purchases: guide.total_purchases || 0,
        revenue: (guide.total_purchases || 0) * (guide.price_usd || 0),
        category: guide.category
      }));

      setAnalytics({
        totalGuides: guidesResult.count || 0,
        totalCreators: creatorsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalRevenue: totalRevenue,
        topSellingGuides: formattedTopGuides,
        topCreators: topCreators.sort((a, b) => b.total_sales - a.total_sales),
        categoryStats: categoryStats.sort((a, b) => b.revenue - a.revenue),
        monthlyStats: [] // Placeholder for monthly data
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'text-blue-600';
      case 'gold': return 'text-yellow-600';
      case 'silver': return 'text-gray-600';
      default: return 'text-orange-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
          <p className="text-muted-foreground">Comprehensive platform performance overview</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
            <SelectItem value="365">1 year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Guides</p>
                <p className="text-2xl font-bold">{analytics.totalGuides}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Creators</p>
                <p className="text-2xl font-bold">{analytics.totalCreators}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{analytics.totalUsers}</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Guides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Selling Audio Guides
            </CardTitle>
            <CardDescription>Most popular guides by purchase count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topSellingGuides.slice(0, 5).map((guide, index) => (
                <div key={guide.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <div>
                      <p className="font-medium text-sm">{guide.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {guide.creator_name} • {guide.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{guide.total_purchases} sales</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(guide.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Creators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Top Performing Creators
            </CardTitle>
            <CardDescription>Highest earning content creators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCreators.slice(0, 5).map((creator, index) => (
                <div key={creator.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <div>
                      <p className="font-medium text-sm">{creator.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getTierColor(creator.tier)}`}
                        >
                          {creator.tier}
                        </Badge>
                        {creator.avg_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{creator.avg_rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{creator.total_sales} sales</p>
                    <p className="text-sm text-muted-foreground">
                      {creator.total_guides} guides
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Category Performance
            </CardTitle>
            <CardDescription>Revenue by guide category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.categoryStats.slice(0, 6).map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{category.category}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(category.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.count} guides
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Growth</CardTitle>
            <CardDescription>Key growth metrics overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Guide Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {analytics.topSellingGuides.length > 0 
                      ? (analytics.topSellingGuides.reduce((sum, guide) => sum + (guide.total_purchases || 0), 0) / analytics.topSellingGuides.length).toFixed(1)
                      : '0.0'
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg. Revenue per Guide</span>
                <span className="font-semibold">
                  {formatCurrency(analytics.totalGuides > 0 ? analytics.totalRevenue / analytics.totalGuides : 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Creator to User Ratio</span>
                <span className="font-semibold">
                  1:{analytics.totalUsers > 0 ? Math.round(analytics.totalUsers / analytics.totalCreators) : 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Guides per Creator</span>
                <span className="font-semibold">
                  {analytics.totalCreators > 0 ? (analytics.totalGuides / analytics.totalCreators).toFixed(1) : '0.0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};