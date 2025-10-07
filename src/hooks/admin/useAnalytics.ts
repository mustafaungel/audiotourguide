import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GuideAnalytics {
  guide_id: string;
  title: string;
  total_purchases: number;
  total_reviews: number;
  avg_rating: number;
  total_views: number;
  total_revenue: number;
}

export const useAnalytics = (dateRange: string) => {
  return useQuery({
    queryKey: ['admin-analytics', dateRange],
    queryFn: async (): Promise<GuideAnalytics[]> => {
      // Query the materialized view
      const { data, error } = await supabase
        .from('guide_analytics_summary')
        .select('*')
        .order('total_views', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const refreshAnalytics = async () => {
  const { error } = await supabase.rpc('refresh_analytics_summary');
  if (error) {
    console.error('Error refreshing analytics:', error);
    throw error;
  }
};
