import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculatePaginationRange, createPaginationResult } from '@/utils/admin/pagination';

export const REVIEWS_QUERY_KEY = 'admin-reviews';

interface UseReviewsOptions {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

export const useReviews = ({ page = 1, pageSize = 25, status }: UseReviewsOptions = {}) => {
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: [REVIEWS_QUERY_KEY, page, pageSize, status],
    queryFn: async () => {
      const { from, to } = calculatePaginationRange(page, pageSize);

      let query = supabase
        .from('guest_reviews')
        .select('id, guide_id, name, comment, rating, status, created_at, email', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: reviewsData, error, count } = await query;

      if (error) throw error;

      const reviewsWithGuides = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: guide } = await supabase
            .from('audio_guides')
            .select('title')
            .eq('id', review.guide_id)
            .maybeSingle();
          
          return {
            ...review,
            audio_guides: guide,
          };
        })
      );

      return createPaginationResult(
        reviewsWithGuides,
        count || 0,
        page,
        pageSize
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, status }: { reviewId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('guest_reviews')
        .update({ status })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: [REVIEWS_QUERY_KEY] });
      toast.success(`Review ${status} successfully`);
    },
    onError: () => {
      toast.error('Failed to update review');
    },
  });

  return {
    ...reviewsQuery,
    updateReview: updateReviewMutation.mutate,
    isUpdating: updateReviewMutation.isPending,
  };
};
