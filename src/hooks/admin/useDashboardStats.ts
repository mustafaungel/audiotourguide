import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalGuides: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
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

      return {
        totalGuides: guides?.length || 0,
        totalRevenue: totalRevenue / 100,
        monthlyRevenue: monthlyRevenue / 100
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
