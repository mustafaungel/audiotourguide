import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { calculatePaginationRange, createPaginationResult } from '@/utils/admin/pagination';

export const DESTINATIONS_QUERY_KEY = 'admin-destinations';

interface UseDestinationsOptions {
  page?: number;
  pageSize?: number;
}

export const useDestinations = ({ page = 1, pageSize = 30 }: UseDestinationsOptions = {}) => {
  const queryClient = useQueryClient();

  const destinationsQuery = useQuery({
    queryKey: [DESTINATIONS_QUERY_KEY, page, pageSize],
    queryFn: async () => {
      const { from, to } = calculatePaginationRange(page, pageSize);

      const { data, error, count } = await supabase
        .from('destinations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return createPaginationResult(
        data || [],
        count || 0,
        page,
        pageSize
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const updateDestinationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('destinations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DESTINATIONS_QUERY_KEY] });
    },
  });

  const deleteDestinationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DESTINATIONS_QUERY_KEY] });
      toast({ title: "Success", description: "Destination deleted successfully!" });
    },
  });

  return {
    ...destinationsQuery,
    updateDestination: updateDestinationMutation.mutate,
    deleteDestination: deleteDestinationMutation.mutate,
    isUpdating: updateDestinationMutation.isPending,
    isDeleting: deleteDestinationMutation.isPending,
  };
};
