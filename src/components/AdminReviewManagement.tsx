import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Star, Clock, User, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GuestReview {
  id: string;
  guide_id: string;
  name: string;
  email: string;
  comment: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  audio_guides?: {
    title: string;
  };
}

export const AdminReviewManagement = () => {
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // First get guest reviews - use explicit column selection for security
      // Email is excluded from default query to prevent accidental exposure in logs
      const { data: reviewsData, error } = await supabase
        .from('guest_reviews')
        .select('id, guide_id, name, comment, rating, status, created_at, email')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Then get guide titles separately
      const reviewsWithGuides = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: guide } = await supabase
            .from('audio_guides')
            .select('title')
            .eq('id', review.guide_id)
            .maybeSingle();
          
          return {
            ...review,
            audio_guides: guide
          };
        })
      );

      setReviews(reviewsWithGuides);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (reviewId: string, status: 'approved' | 'rejected') => {
    setActionLoading(reviewId);
    
    try {
      const { error } = await supabase
        .from('guest_reviews')
        .update({ status })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success(`Review ${status} successfully`);
      fetchReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading reviews...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const approvedReviews = reviews.filter(r => r.status === 'approved');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Reviews ({pendingReviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingReviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No pending reviews to approve
            </p>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{review.name}</span>
                        <Mail className="h-4 w-4 text-muted-foreground ml-2" />
                        <span className="text-sm text-muted-foreground">{review.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">
                          for "{review.audio_guides?.title || 'Unknown Guide'}"
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(review.id, 'approved')}
                        disabled={actionLoading === review.id}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(review.id, 'rejected')}
                        disabled={actionLoading === review.id}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm">{review.comment}</p>
                  <div className="text-xs text-muted-foreground">
                    Submitted: {formatDate(review.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Approved Reviews ({approvedReviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedReviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No approved reviews yet
            </p>
          ) : (
            <div className="space-y-4">
              {approvedReviews.slice(0, 10).map((review) => (
                <div key={review.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.name}</span>
                      {renderStars(review.rating)}
                      <Badge variant="secondary" className="text-green-600">
                        Approved
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{review.comment}</p>
                  <p className="text-xs text-muted-foreground">
                    Guide: {review.audio_guides?.title || 'Unknown Guide'}
                  </p>
                </div>
              ))}
              {approvedReviews.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing latest 10 approved reviews
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};