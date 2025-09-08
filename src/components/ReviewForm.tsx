import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TextareaWithCounter } from '@/components/ui/character-counter';

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
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      // Always submit with rating of 5 since we're removing star ratings
      await onSubmit(5, comment);
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
          {/* Comment */}
          <TextareaWithCounter
            maxLength={maxLength}
            label="Your Review"
            placeholder={placeholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
            helpText="Share your honest experience to help other travelers"
            showProgress
          />

          <Button
            type="submit"
            disabled={!comment.trim() || isSubmitting || comment.length > maxLength}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};