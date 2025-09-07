import React from 'react';
import { Navigation } from '@/components/Navigation';
import { CreatorDashboard as CreatorDashboardComponent } from '@/components/CreatorDashboard';
import { CreatorEarningsDashboard } from '@/components/CreatorEarningsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, DollarSign, Users, TrendingUp, Plus } from 'lucide-react';
import { CreatorGuideCreation } from '@/components/CreatorGuideCreation';
import { useAuth } from '@/contexts/AuthContext';

const CreatorDashboard = () => {
  const { user, userProfile } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to access your creator dashboard.</p>
        </div>
      </div>
    );
  }

  // For demo purposes, allow access to creator dashboard for testing
  // In production, you'd want stricter role checking

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your audio guides and track performance</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Guide
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="audience" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Audience
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <CreatorDashboardComponent />
          </TabsContent>

          <TabsContent value="create">
            <CreatorGuideCreation />
          </TabsContent>

          <TabsContent value="earnings">
            <CreatorEarningsDashboard />
          </TabsContent>

          <TabsContent value="audience">
            <div className="text-center py-16">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Audience Analytics</h3>
              <p className="text-muted-foreground">Coming soon - detailed audience insights and demographics</p>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-16">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground">Coming soon - comprehensive performance metrics and trends</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatorDashboard;