import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, BookOpen, Clock, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { AdminQRCodeRegenerator } from './AdminQRCodeRegenerator';
import { PaymentFlowTestPanel } from './PaymentFlowTestPanel';
import { AdminEmailTesting } from './AdminEmailTesting';

interface DashboardStats {
  totalUsers: number;
  totalGuides: number;
  pendingApprovals: number;
  pendingVerifications: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalGuides: 0,
    pendingApprovals: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get guide stats
      const { data: guides } = await supabase
        .from('audio_guides')
        .select('*');

      const { count: pendingGuides } = await supabase
        .from('audio_guides')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

      // Get verification requests
      const { count: pendingVerifications } = await supabase
        .from('verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

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
        totalUsers: userCount || 0,
        totalGuides: guides?.length || 0,
        pendingApprovals: pendingGuides || 0,
        pendingVerifications: pendingVerifications || 0,
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
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Guides awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
            <p className="text-xs text-muted-foreground">Creator applications pending</p>
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-sm">New creator verification request</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <p className="text-sm">Audio guide submitted for approval</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <p className="text-sm">New user registration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 hover:bg-muted rounded">
                <span className="text-sm">Review pending guides</span>
                <span className="text-xs text-muted-foreground">{stats.pendingApprovals}</span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-muted rounded">
                <span className="text-sm">Process verifications</span>
                <span className="text-xs text-muted-foreground">{stats.pendingVerifications}</span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-muted rounded">
                <span className="text-sm">View analytics</span>
                <span className="text-xs text-muted-foreground">→</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Testing and Management Tools */}
      <div className="space-y-6">
        <AdminEmailTesting />
        <div className="grid lg:grid-cols-2 gap-6">
          <PaymentFlowTestPanel />
          <AdminQRCodeRegenerator />
        </div>
      </div>
    </div>
  );
};