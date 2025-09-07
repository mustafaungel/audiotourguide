import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Target,
  BarChart3,
  Download,
  Eye,
  Users,
  Clock,
  Award,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  todayEarnings: number;
  avgEarningsPerGuide: number;
  topEarningGuide: string;
  totalSales: number;
  conversionRate: number;
}

interface GuidePerformance {
  guide_id: string;
  title: string;
  total_earnings: number;
  total_sales: number;
  views: number;
  conversion_rate: number;
  avg_rating: number;
  created_at: string;
}

interface PayoutHistory {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'processed' | 'completed';
  method: string;
}

export const CreatorEarningsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [guidePerformance, setGuidePerformance] = useState<GuidePerformance[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user) {
      fetchEarningsData();
      fetchGuidePerformance();
      fetchPayoutHistory();
    }
  }, [user, timeRange]);

  const fetchEarningsData = async () => {
    try {
      // For demo purposes, we'll create mock data
      // In a real app, this would query the creator_earnings table
      setEarningsData({
        totalEarnings: 2847.50,
        monthlyEarnings: 429.75,
        weeklyEarnings: 87.25,
        todayEarnings: 12.50,
        avgEarningsPerGuide: 23.45,
        topEarningGuide: 'Rome Colosseum Tour',
        totalSales: 156,
        conversionRate: 4.2
      });
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
    }
  };

  const fetchGuidePerformance = async () => {
    try {
      // Mock guide performance data
      setGuidePerformance([
        {
          guide_id: '1',
          title: 'Rome Colosseum Tour',
          total_earnings: 456.75,
          total_sales: 32,
          views: 1250,
          conversion_rate: 2.56,
          avg_rating: 4.8,
          created_at: '2024-01-15'
        },
        {
          guide_id: '2',
          title: 'Paris Louvre Museum',
          total_earnings: 389.25,
          total_sales: 28,
          views: 980,
          conversion_rate: 2.86,
          avg_rating: 4.6,
          created_at: '2024-02-01'
        },
        {
          guide_id: '3',
          title: 'Florence Art Walk',
          total_earnings: 234.50,
          total_sales: 19,
          views: 750,
          conversion_rate: 2.53,
          avg_rating: 4.7,
          created_at: '2024-02-15'
        }
      ]);
    } catch (error) {
      console.error('Error fetching guide performance:', error);
    }
  };

  const fetchPayoutHistory = async () => {
    try {
      // Mock payout history
      setPayoutHistory([
        {
          id: '1',
          amount: 234.50,
          date: '2024-03-01',
          status: 'completed',
          method: 'PayPal'
        },
        {
          id: '2',
          amount: 189.75,
          date: '2024-02-01',
          status: 'completed',
          method: 'Bank Transfer'
        },
        {
          id: '3',
          amount: 156.25,
          date: '2024-01-01',
          status: 'processed',
          method: 'PayPal'
        }
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payout history:', error);
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    try {
      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted and will be processed within 3-5 business days.",
      });
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast({
        title: "Error",
        description: "Failed to submit payout request",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!earningsData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Earnings Dashboard</h1>
          <p className="text-muted-foreground">Track your revenue and guide performance</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={requestPayout} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Request Payout
          </Button>
        </div>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold">${earningsData.totalEarnings.toFixed(2)}</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12.5% this month
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold">${earningsData.monthlyEarnings.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  vs ${(earningsData.monthlyEarnings * 0.85).toFixed(2)} last month
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg per Guide</p>
                <p className="text-3xl font-bold">${earningsData.avgEarningsPerGuide.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  {earningsData.totalSales} total sales
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold">{earningsData.conversionRate}%</p>
                <p className="text-sm text-green-600">Above average</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Guide Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
          <TabsTrigger value="goals">Goals & Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Top Performing Guides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {guidePerformance.map((guide, index) => (
                  <div key={guide.guide_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{guide.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${guide.total_earnings.toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {guide.total_sales} sales
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {guide.views} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {guide.conversion_rate}% conversion
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {guide.avg_rating} ★
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Guide Sales</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <Progress value={85} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Live Experiences</span>
                      <span className="text-sm font-medium">12%</span>
                    </div>
                    <Progress value={12} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Tips & Bonuses</span>
                      <span className="text-sm font-medium">3%</span>
                    </div>
                    <Progress value={3} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Growth</span>
                    <Badge variant="secondary" className="text-green-600">
                      +15.2%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New Customers</span>
                    <Badge variant="secondary">
                      +23 this week
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Return Rate</span>
                    <Badge variant="secondary">
                      34%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Rating</span>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      4.7 ★
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payout History</CardTitle>
                <Badge variant="outline">
                  ${earningsData.monthlyEarnings.toFixed(2)} available
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutHistory.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">${payout.amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payout.date).toLocaleDateString()} • {payout.method}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={payout.status === 'completed' ? 'default' : 'secondary'}
                      className={
                        payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payout.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Monthly Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Progress to $500</span>
                      <span className="text-sm font-medium">
                        ${earningsData.monthlyEarnings.toFixed(2)} / $500
                      </span>
                    </div>
                    <Progress value={(earningsData.monthlyEarnings / 500) * 100} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${(500 - earningsData.monthlyEarnings).toFixed(2)} remaining to reach your goal
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">First $1K earned</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ Achieved
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">100 guides sold</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ Achieved
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">4.5+ star rating</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ Achieved
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">First $5K earned</span>
                    <Badge variant="secondary">
                      ${(5000 - earningsData.totalEarnings).toFixed(0)} to go
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};