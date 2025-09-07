import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TextareaWithCounter } from '@/components/ui/character-counter';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => Promise<void>;
  isSubmitting?: boolean;
  title?: string;
  placeholder?: string;
  maxLength?: number;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  isSubmitting = false,
  title = "Write a Review",
  placeholder = "Share your experience...",
  maxLength = 500
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0) {
      await onSubmit(rating, comment);
      setRating(0);
      setComment('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">Rating *</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={cn(
                    "p-1 transition-colors",
                    "hover:text-warning focus:outline-none focus:ring-2 focus:ring-ring rounded"
                  )}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      (hoveredRating >= star || rating >= star)
                        ? "fill-warning text-warning"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} star{rating !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <TextareaWithCounter
            maxLength={maxLength}
            label="Review (Optional)"
            placeholder={placeholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
            helpText="Share your honest experience to help other travelers"
            showProgress
          />

          <Button
            type="submit"
            disabled={rating === 0 || isSubmitting || comment.length > maxLength}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};