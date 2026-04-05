import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { t } from '@/lib/translations';

interface GuestReviewFormProps {
  guideId: string;
  onReviewSubmitted?: () => void;
  lang?: string;
}

export const GuestReviewForm = ({ guideId, onReviewSubmitted, lang = 'en' }: GuestReviewFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    comment: '',
    rating: 0
  });
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation (server-side validation is now enforced via database trigger)
    if (!formData.name.trim() || !formData.email.trim() || !formData.comment.trim()) {
      toast.error(t('fillAllFields', lang));
      return;
    }

    if (formData.rating === 0) {
      toast.error(t('selectRating', lang));
      return;
    }

    // Enhanced email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error(t('invalidEmail', lang));
      return;
    }

    // Length validations (matching server-side rules)
    if (formData.name.trim().length < 2 || formData.name.trim().length > 100) {
      toast.error(t('nameLengthError', lang));
      return;
    }

    if (formData.comment.trim().length < 10 || formData.comment.trim().length > 2000) {
      toast.error(t('commentLengthError', lang));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('guest_reviews')
        .insert({
          guide_id: guideId,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          comment: formData.comment.trim(),
          rating: formData.rating
        });

      if (error) {
        // Handle specific validation errors from the database trigger
        if (error.message.includes('must be between')) {
          toast.error(error.message);
        } else if (error.message.includes('Invalid email')) {
          toast.error(t('invalidEmail', lang));
        } else if (error.message.includes('prohibited content')) {
          toast.error(t('prohibitedContent', lang));
        } else {
          throw error;
        }
        return;
      }

      toast.success(t('reviewSuccess', lang));
      setFormData({ name: '', email: '', comment: '', rating: 0 });
      onReviewSubmitted?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('submitError', lang));
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('leaveReview', lang)}</CardTitle>
        <CardDescription>
          {t('reviewDescription', lang)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t('name', lang)} *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('namePlaceholder', lang)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="email">{t('email', lang)} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('emailPlaceholder', lang)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label>{t('rating', lang)} *</Label>
            <div className="flex items-center space-x-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={loading}
                  className="text-2xl transition-colors duration-150"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoveredRating || formData.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Review *</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your thoughts about this audio guide..."
              rows={4}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};