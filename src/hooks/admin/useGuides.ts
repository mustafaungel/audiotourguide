import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { calculatePaginationRange, createPaginationResult } from '@/utils/admin/pagination';

export const GUIDES_QUERY_KEY = 'admin-guides';

interface UseGuidesOptions {
  page?: number;
  pageSize?: number;
}

export const useGuides = ({ page = 1, pageSize = 20 }: UseGuidesOptions = {}) => {
  const queryClient = useQueryClient();

  const guidesQuery = useQuery({
    queryKey: [GUIDES_QUERY_KEY, page, pageSize],
    queryFn: async () => {
      const { from, to } = calculatePaginationRange(page, pageSize);

      const { data: guides, error, count } = await supabase
        .from('audio_guides')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return createPaginationResult(
        guides || [],
        count || 0,
        page,
        pageSize
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateGuideMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('audio_guides')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUIDES_QUERY_KEY] });
    },
  });

  const deleteGuideMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audio_guides')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUIDES_QUERY_KEY] });
      toast({
        title: "Guide Deleted",
        description: "Guide has been permanently deleted.",
      });
    },
  });

  return {
    ...guidesQuery,
    updateGuide: updateGuideMutation.mutate,
    deleteGuide: deleteGuideMutation.mutate,
    isUpdating: updateGuideMutation.isPending,
    isDeleting: deleteGuideMutation.isPending,
  };
};
