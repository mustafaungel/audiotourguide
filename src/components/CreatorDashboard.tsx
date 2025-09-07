import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { TierProgress } from '@/components/TierProgress';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Edit, BarChart3, DollarSign, Star, TrendingUp } from 'lucide-react';
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
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

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
      
      // Calculate stats
      const totalGuides = data?.length || 0;
      const publishedGuides = data?.filter(g => g.is_published && g.is_approved).length || 0;
      const totalRevenue = data?.reduce((sum, g) => sum + (g.total_purchases * g.price_usd), 0) || 0;
      const averageRating = data?.reduce((sum, g) => sum + (g.rating || 0), 0) / totalGuides || 0;

      setStats({
        totalGuides,
        publishedGuides,
        totalRevenue: totalRevenue / 100, // Convert from cents
        averageRating
      });
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
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guides</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGuides}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedGuides}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress Section */}
      <TierProgress userProfile={userProfile} showUpdateButton={true} />

      {/* Guides List */}
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
                <div key={guide.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{guide.title}</h3>
                      {getStatusBadge(guide)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{guide.location} • {guide.category}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>${(guide.price_usd / 100).toFixed(2)}</span>
                      <span>{guide.total_purchases} purchases</span>
                      <span>⭐ {guide.rating || 0} ({guide.total_reviews} reviews)</span>
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
    </div>
  );
};