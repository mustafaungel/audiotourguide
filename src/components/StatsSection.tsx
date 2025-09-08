import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface HomepageStat {
  id: string;
  stat_type: string;
  stat_value: number;
  stat_label: string;
  stat_description: string;
  display_order: number;
  is_active: boolean;
  icon: string;
}

export default function StatsSection() {
  const [stats, setStats] = useState<HomepageStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_stats')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to default stats if database fails
      setStats([
        { id: '1', stat_type: 'unesco_sites', stat_value: 1154, stat_label: 'UNESCO Sites', stat_description: 'World Heritage destinations', display_order: 1, is_active: true, icon: '🏛️' },
        { id: '2', stat_type: 'museums', stat_value: 55000, stat_label: 'Museums', stat_description: 'Cultural institutions worldwide', display_order: 2, is_active: true, icon: '🗺️' },
        { id: '3', stat_type: 'landmarks', stat_value: 10000, stat_label: 'Landmarks', stat_description: 'Iconic destinations covered', display_order: 3, is_active: true, icon: '🎨' },
        { id: '4', stat_type: 'countries', stat_value: 195, stat_label: 'Countries', stat_description: 'Global travel experiences', display_order: 4, is_active: true, icon: '🌍' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatStatValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k+`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Did You Know?</h2>
        <p className="text-lg text-muted-foreground">
          Explore the world's cultural treasures by the numbers
        </p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.id} className="text-center p-6 bg-card/50 backdrop-blur-sm rounded-lg border">
            <div className="text-3xl mb-3">{stat.icon}</div>
            <div className="text-2xl font-bold mb-1">
              {stat.stat_value >= 1000 ? formatStatValue(stat.stat_value) : stat.stat_value.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">{stat.stat_label}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.stat_description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}