import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ServiceRatingFormProps {
  creatorId: string;
  guideId?: string;
  experienceId?: string;
  isVerifiedPurchase?: boolean;
  onSubmit?: (rating: any) => void;
  onCancel?: () => void;
}

export const ServiceRatingForm: React.FC<ServiceRatingFormProps> = ({
  creatorId,
  guideId,
  experienceId,
  isVerifiedPurchase = false,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [serviceCategory, setServiceCategory] = useState('overall');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to submit a rating.",
      });
      return;
    }

    if (rating === 0) {
      toast({
        variant: "destructive",
        title: "Rating required",
        description: "Please select a star rating.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('creator_service_ratings')
        .insert({
          user_id: user.id,
          creator_id: creatorId,
          guide_id: guideId || null,
          experience_id: experienceId || null,
          rating,
          review_text: reviewText || null,
          service_category: serviceCategory,
          is_verified_purchase: isVerifiedPurchase,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });

      onSubmit?.(data);
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit rating. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-base font-medium">Rate Your Experience</Label>
          <p className="text-sm text-muted-foreground mb-3">
            How would you rate this creator's service?
          </p>
          
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => handleStarClick(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hoveredStar || rating)
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground/30'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="service-category">Service Category</Label>
          <Select value={serviceCategory} onValueChange={setServiceCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall Experience</SelectItem>
              <SelectItem value="guide">Audio Guide Quality</SelectItem>
              <SelectItem value="experience">Live Experience</SelectItem>
              <SelectItem value="communication">Communication</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="review-text">Review (Optional)</Label>
          <Textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with other travelers..."
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {reviewText.length}/500 characters
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};