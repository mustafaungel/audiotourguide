import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Star, Clock, User, Mail } from 'lucide-react';
import { useReviews } from '@/hooks/admin/useReviews';
import { usePagination } from '@/hooks/admin/usePagination';
import { PaginationControls } from '@/components/admin/PaginationControls';
import { PAGINATION_CONFIG } from '@/utils/admin/pagination';

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
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  const { currentPage: pendingPage, pageSize: pendingPageSize, goToPage: goToPendingPage } = usePagination({
    pageSize: PAGINATION_CONFIG.REVIEWS_PER_PAGE,
  });

  const { currentPage: approvedPage, pageSize: approvedPageSize, goToPage: goToApprovedPage } = usePagination({
    pageSize: PAGINATION_CONFIG.REVIEWS_PER_PAGE,
  });

  const {
    data: pendingResult,
    isLoading: pendingLoading,
    updateReview: updatePendingReview,
    isUpdating: pendingUpdating,
  } = useReviews({ 
    page: pendingPage, 
    pageSize: pendingPageSize,
    status: 'pending'
  });

  const {
    data: approvedResult,
    isLoading: approvedLoading,
  } = useReviews({ 
    page: approvedPage, 
    pageSize: approvedPageSize,
    status: 'approved'
  });

  const handleApproval = (reviewId: string, status: 'approved' | 'rejected') => {
    updatePendingReview({ reviewId, status });
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

  const isLoading = pendingLoading || approvedLoading;

  if (isLoading && !pendingResult && !approvedResult) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading reviews...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingReviews = pendingResult?.data || [];
  const approvedReviews = approvedResult?.data || [];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="pending">
            Pending ({pendingResult?.totalCount || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedResult?.totalCount || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingReviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No pending reviews to approve
                </p>
              ) : (
                <>
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
                        disabled={pendingUpdating}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(review.id, 'rejected')}
                        disabled={pendingUpdating}
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
                  <PaginationControls
                    currentPage={pendingPage}
                    totalPages={pendingResult?.totalPages || 1}
                    onPageChange={goToPendingPage}
                    hasNextPage={pendingResult?.hasNextPage || false}
                    hasPreviousPage={pendingResult?.hasPreviousPage || false}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Approved Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvedReviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No approved reviews yet
                </p>
              ) : (
                <>
                  <div className="space-y-4">
                    {approvedReviews.map((review) => (
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
                  </div>
                  <PaginationControls
                    currentPage={approvedPage}
                    totalPages={approvedResult?.totalPages || 1}
                    onPageChange={goToApprovedPage}
                    hasNextPage={approvedResult?.hasNextPage || false}
                    hasPreviousPage={approvedResult?.hasPreviousPage || false}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};