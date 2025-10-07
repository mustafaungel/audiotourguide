import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, Share2, ShoppingBag, TrendingUp, TrendingDown, RefreshCw, Download, Calendar, Award } from 'lucide-react';
import { useAnalytics, refreshAnalytics } from '@/hooks/admin/useAnalytics';

interface GuideAnalytics {
  id: string;
  title: string;
  total_views: number;
  total_shares: number;
  total_purchases: number;
  revenue: number;
  viral_score: number;
  ctr: number;
  trend: 'up' | 'down' | 'stable';
}

interface AnalyticsMetrics {
  totalViews: number;
  totalShares: number;
  totalPurchases: number;
  totalRevenue: number;
  avgCTR: number;
  topPerformingGuide: string;
}

export const AdminAnalyticsManager = () => {
  const [dateRange, setDateRange] = useState('7');
  const [sortBy, setSortBy] = useState('views');
  const { toast } = useToast();
  
  const { data: analyticsData, isLoading, refetch } = useAnalytics(dateRange);

  // Transform analytics data into the format used by charts and display
  const guides: GuideAnalytics[] = (analyticsData || []).map(data => ({
    id: data.guide_id,
    title: data.title,
    total_views: data.total_views,
    total_shares: 0, // Not in materialized view yet
    total_purchases: data.total_purchases,
    revenue: data.total_revenue,
    viral_score: 0, // Not in materialized view yet
    ctr: data.total_views > 0 ? (data.total_purchases / data.total_views) * 100 : 0,
    trend: data.total_purchases > 10 ? 'up' as const : data.total_purchases > 5 ? 'stable' as const : 'down' as const
  }));

  // Calculate overall metrics from the data
  const metrics: AnalyticsMetrics = {
    totalViews: guides.reduce((sum, g) => sum + g.total_views, 0),
    totalShares: guides.reduce((sum, g) => sum + g.total_shares, 0),
    totalPurchases: guides.reduce((sum, g) => sum + g.total_purchases, 0),
    totalRevenue: guides.reduce((sum, g) => sum + g.revenue, 0),
    avgCTR: guides.length > 0 
      ? guides.reduce((sum, g) => sum + g.ctr, 0) / guides.length 
      : 0,
    topPerformingGuide: guides.length > 0 
      ? guides.sort((a, b) => b.total_views - a.total_views)[0]?.title || 'N/A'
      : 'N/A'
  };

  const handleRefresh = async () => {
    try {
      await refreshAnalytics();
      await refetch();
      toast({
        title: "Refreshed",
        description: "Analytics data has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh analytics",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Guide Title', 'Views', 'Shares', 'Purchases', 'Revenue', 'CTR%', 'Viral Score'],
      ...guides.map(g => [
        g.title,
        g.total_views,
        g.total_shares,
        g.total_purchases,
        (g.revenue / 100).toFixed(2),
        g.ctr.toFixed(2),
        g.viral_score.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sortedGuides = [...guides].sort((a, b) => {
    switch (sortBy) {
      case 'views': return b.total_views - a.total_views;
      case 'shares': return b.total_shares - a.total_shares;
      case 'purchases': return b.total_purchases - a.total_purchases;
      case 'revenue': return b.revenue - a.revenue;
      case 'ctr': return b.ctr - a.ctr;
      default: return 0;
    }
  });

  const COLORS = ['#8b5cf6', '#06b6d4', '#84cc16', '#f59e0b', '#ef4444'];

  const chartData = sortedGuides.slice(0, 10).map(guide => ({
    name: guide.title.length > 20 ? guide.title.substring(0, 20) + '...' : guide.title,
    views: guide.total_views,
    shares: guide.total_shares,
    purchases: guide.total_purchases,
    revenue: guide.revenue / 100
  }));

  const pieData = sortedGuides.slice(0, 5).map((guide, index) => ({
    name: guide.title.length > 15 ? guide.title.substring(0, 15) + '...' : guide.title,
    value: guide.total_views,
    color: COLORS[index % COLORS.length]
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>Loading analytics data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Fetching analytics data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>Audio guide performance analytics and insights</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{metrics.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
                  <p className="text-2xl font-bold">{metrics.totalShares.toLocaleString()}</p>
                </div>
                <Share2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                  <p className="text-2xl font-bold">{metrics.totalPurchases.toLocaleString()}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${(metrics.totalRevenue / 100).toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. CTR</p>
                  <p className="text-2xl font-bold">{metrics.avgCTR.toFixed(2)}%</p>
                </div>
                <Award className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Performer</p>
                  <p className="text-lg font-bold truncate">{metrics.topPerformingGuide}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Views, shares, and purchases by guide</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#8b5cf6" name="Views" />
                <Bar dataKey="shares" fill="#06b6d4" name="Shares" />
                <Bar dataKey="purchases" fill="#84cc16" name="Purchases" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Views Distribution</CardTitle>
            <CardDescription>Top 5 guides by view count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Guide Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Guide Performance</CardTitle>
              <CardDescription>Detailed analytics for all audio guides</CardDescription>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="views">Sort by Views</SelectItem>
                <SelectItem value="shares">Sort by Shares</SelectItem>
                <SelectItem value="purchases">Sort by Purchases</SelectItem>
                <SelectItem value="revenue">Sort by Revenue</SelectItem>
                <SelectItem value="ctr">Sort by CTR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedGuides.map((guide) => (
              <div key={guide.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{guide.title}</h3>
                    {guide.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {guide.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {guide.viral_score > 70 && <Badge variant="default">🔥 Trending</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{guide.total_views}</p>
                    <p className="text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{guide.total_shares}</p>
                    <p className="text-muted-foreground">Shares</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{guide.total_purchases}</p>
                    <p className="text-muted-foreground">Purchases</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">${(guide.revenue / 100).toFixed(2)}</p>
                    <p className="text-muted-foreground">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{guide.ctr.toFixed(2)}%</p>
                    <p className="text-muted-foreground">CTR</p>
                  </div>
                </div>
              </div>
            ))}
            {sortedGuides.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No analytics data available for the selected period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};