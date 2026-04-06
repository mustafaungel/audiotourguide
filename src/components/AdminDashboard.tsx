import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, DollarSign, TrendingUp, ChevronDown, QrCode, Mail, BarChart3, Star, Eye } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

// Lazy imports
const LazyAdminQRCodeDropdown = React.lazy(() => import('./AdminQRCodeDropdown').then(m => ({ default: m.AdminQRCodeDropdown })));
const LazyAdminContactManagement = React.lazy(() => import('./AdminContactManagement').then(m => ({ default: m.AdminContactManagement })));
const LazyEnhancedEmailTesting = React.lazy(() => import('./EnhancedEmailTesting').then(m => ({ default: m.EnhancedEmailTesting })));
const LazyAdminAnalyticsManager = React.lazy(() => import('./AdminAnalyticsManager').then(m => ({ default: m.AdminAnalyticsManager })));
const LazyAdminReviewManagement = React.lazy(() => import('./AdminReviewManagement').then(m => ({ default: m.AdminReviewManagement })));
const LazyAdminPreviewTab = React.lazy(() => import('./AdminPreviewTab'));

interface DashboardStats {
  totalGuides: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

const collapsibleSections = [
  { key: 'qr', icon: QrCode, label: 'QR Code Management' },
  { key: 'contact', icon: Mail, label: 'Contact Management' },
  { key: 'email', icon: Mail, label: 'Email System' },
  { key: 'analytics', icon: BarChart3, label: 'Analytics' },
  { key: 'reviews', icon: Star, label: 'Review Management' },
  { key: 'preview', icon: Eye, label: 'Preview' },
];

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalGuides: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [mountedSections, setMountedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleOpenChange = useCallback((key: string, open: boolean) => {
    if (open && !mountedSections.has(key)) {
      setMountedSections(prev => new Set(prev).add(key));
    }
  }, [mountedSections]);

  const renderSectionComponent = (key: string) => {
    if (!mountedSections.has(key)) return null;
    const fallback = <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>;
    switch (key) {
      case 'qr': return <React.Suspense fallback={fallback}><LazyAdminQRCodeDropdown /></React.Suspense>;
      case 'contact': return <React.Suspense fallback={fallback}><LazyAdminContactManagement /></React.Suspense>;
      case 'email': return <React.Suspense fallback={fallback}><LazyEnhancedEmailTesting /></React.Suspense>;
      case 'analytics': return <React.Suspense fallback={fallback}><LazyAdminAnalyticsManager /></React.Suspense>;
      case 'reviews': return <React.Suspense fallback={fallback}><LazyAdminReviewManagement /></React.Suspense>;
      case 'preview': return <React.Suspense fallback={fallback}><LazyAdminPreviewTab /></React.Suspense>;
      default: return null;
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const { data: guides } = await supabase
        .from('audio_guides')
        .select('id');

      const { data: purchases } = await supabase
        .from('user_purchases')
        .select('price_paid, purchase_date');

      const totalRevenue = purchases?.reduce((sum, p) => sum + p.price_paid, 0) || 0;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = purchases?.filter(p => {
        const purchaseDate = new Date(p.purchase_date);
        return purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear;
      }).reduce((sum, p) => sum + p.price_paid, 0) || 0;

      setStats({
        totalGuides: guides?.length || 0,
        totalRevenue: totalRevenue / 100,
        monthlyRevenue: monthlyRevenue / 100
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <p className="text-muted-foreground">Platform statistics and key metrics</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guides</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGuides}</div>
            <p className="text-xs text-muted-foreground">Audio guides created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All-time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month's earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible Management Sections — lazy mounted */}
      <div className="space-y-3">
        {collapsibleSections.map((section) => (
          <Card key={section.key}>
            <Collapsible onOpenChange={(open) => handleOpenChange(section.key, open)}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-4 hover:bg-muted h-auto"
                >
                  <div className="flex items-center gap-2">
                    <section.icon className="h-5 w-5" />
                    <span className="font-semibold">{section.label}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                {renderSectionComponent(section.key)}
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
};
