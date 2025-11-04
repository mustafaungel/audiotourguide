import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, DollarSign, TrendingUp, ChevronDown, QrCode } from 'lucide-react';
import { AdminQRCodeDropdown } from './AdminQRCodeDropdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';


interface DashboardStats {
  totalGuides: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalGuides: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get guide stats
      const { data: guides } = await supabase
        .from('audio_guides')
        .select('*');

      // Get revenue data
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
        totalRevenue: totalRevenue / 100, // Convert from cents
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

      {/* QR Code Management Dropdown */}
      <Card>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between p-4 hover:bg-muted/50 h-auto"
            >
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                <span className="font-semibold">QR Code Management</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <AdminQRCodeDropdown />
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};