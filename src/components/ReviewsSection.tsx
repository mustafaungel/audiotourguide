import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { ReviewForm } from './ReviewForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ReviewsSectionProps {
  guideId: string;
  isPurchased: boolean;
  showAllReviews?: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string;
  };
}

interface GuestReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_approved: boolean;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  guideId,
  isPurchased,
  showAllReviews = false
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [guestReviews, setGuestReviews] = useState<GuestReview[]>([]);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
    fetchGuestReviews();
    if (user) {
      checkUserReview();
    }
  }, [guideId, user]);

  const fetchReviews = async () => {
    try {
      // First get reviews
      const { data: reviewsData, error } = await supabase
        .from('guide_reviews')
        .select('*')
        .eq('guide_id', guideId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Then get user profiles separately
      const reviewsWithProfiles = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', review.user_id)
            .maybeSingle();
          
          return {
            ...review,
            profiles: profile
          };
        })
      );

      setReviews(reviewsWithProfiles);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('guest_reviews')
        .select('*')
        .eq('guide_id', guideId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuestReviews(data || []);
    } catch (error) {
      console.error('Error fetching guest reviews:', error);
    }
  };

  const checkUserReview = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('guide_reviews')
        .select('id')
        .eq('guide_id', guideId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserHasReviewed(!!data);
    } catch (error) {
      console.error('Error checking user review:', error);
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!user || !isPurchased) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('guide_reviews')
        .insert({
          guide_id: guideId,
          user_id: user.id,
          rating,
          comment: comment || null
        });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      setUserHasReviewed(true);
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Review Form - Only for purchased users who haven't reviewed */}
      {user && isPurchased && !userHasReviewed && (
        <ReviewForm
          onSubmit={handleSubmitReview}
          isSubmitting={isSubmitting}
          title="Share Your Experience"
          placeholder="Tell other travelers about this guide..."
        />
      )}

      {/* Notice for non-purchased users */}
      {!isPurchased && !showAllReviews && (
        <Card className="p-4 bg-muted/30 border-dashed">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">
              Purchase this guide to read reviews and share your own experience
            </p>
          </div>
        </Card>
      )}

      {/* Reviews List - Show to everyone or only purchased users based on showAllReviews */}
      {(showAllReviews || isPurchased) && (
        <>
          {reviews.length === 0 && guestReviews.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                No reviews yet. Be the first to share your experience!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Registered User Reviews */}
              {reviews.map((review) => (
                <Card key={`user-${review.id}`} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">
                        {review.profiles?.full_name || 'Anonymous User'}
                      </h5>
                      <Badge variant="outline" className="text-xs">Verified Purchase</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                </Card>
              ))}

              {/* Guest Reviews */}
              {guestReviews.map((review) => (
                <Card key={`guest-${review.id}`} className="p-4 border-dashed">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{review.name}</h5>
                      <Badge variant="secondary" className="text-xs">Guest Review</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};