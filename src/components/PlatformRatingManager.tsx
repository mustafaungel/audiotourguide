import React, { useState, useEffect } from 'react';
import { Award, Save, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExperienceBracketBadge } from '@/components/ExperienceBracketBadge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getExperienceBracket } from '@/types/creator';

interface PlatformRating {
  id: string;
  rating_category: string;
  rating: number;
  rating_notes: string;
  created_at: string;
}

interface PlatformRatingManagerProps {
  creatorId: string;
  creatorExperienceYears?: number;
  onUpdate?: () => void;
}

const RATING_CATEGORIES = [
  { value: 'expertise', label: 'Subject Expertise' },
  { value: 'reliability', label: 'Reliability & Consistency' },
  { value: 'content_quality', label: 'Content Quality' },
  { value: 'professionalism', label: 'Professionalism' },
];

export const PlatformRatingManager: React.FC<PlatformRatingManagerProps> = ({
  creatorId,
  creatorExperienceYears = 0,
  onUpdate,
}) => {
  const { user, userProfile } = useAuth();
  const [ratings, setRatings] = useState<PlatformRating[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [ratingValue, setRatingValue] = useState('');
  const [ratingNotes, setRatingNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = userProfile?.role === 'admin';
  const experienceBracket = getExperienceBracket(creatorExperienceYears);
  const maxAllowedRating = experienceBracket.maxRating;

  useEffect(() => {
    if (isAdmin) {
      fetchPlatformRatings();
    }
  }, [creatorId, isAdmin]);

  const fetchPlatformRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_platform_ratings')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings(data || []);
    } catch (error) {
      console.error('Error fetching platform ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !ratingValue) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please select a category and rating.",
      });
      return;
    }

    const rating = parseFloat(ratingValue);
    if (rating < 1 || rating > maxAllowedRating) {
      toast({
        variant: "destructive",
        title: "Invalid rating",
        description: `Rating must be between 1.0 and ${maxAllowedRating} for ${experienceBracket.label} creators.`,
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('creator_platform_ratings')
        .upsert({
          creator_id: creatorId,
          rating_category: selectedCategory,
          rating,
          rating_notes: ratingNotes || null,
          rated_by: user!.id,
        });

      if (error) throw error;

      toast({
        title: "Platform rating saved",
        description: "The rating has been successfully updated.",
      });

      // Reset form
      setSelectedCategory('');
      setRatingValue('');
      setRatingNotes('');
      
      // Refresh ratings
      await fetchPlatformRatings();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error saving platform rating:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save rating.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (ratingId: string) => {
    try {
      const { error } = await supabase
        .from('creator_platform_ratings')
        .delete()
        .eq('id', ratingId);

      if (error) throw error;

      toast({
        title: "Rating deleted",
        description: "The platform rating has been removed.",
      });

      await fetchPlatformRatings();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error deleting platform rating:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete rating.",
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading platform ratings...</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold">Platform Rating Management</h3>
        </div>
        <ExperienceBracketBadge 
          experienceYears={creatorExperienceYears} 
          variant="minimal"
        />
      </div>

      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Maximum rating for {experienceBracket.label} creators: {maxAllowedRating}/5.0
          <br />
          Platform ratings are based on expertise level and experience years.
        </AlertDescription>
      </Alert>

      {/* Add/Edit Rating Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Rating Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {RATING_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rating">
              Rating (1.0 - {maxAllowedRating})
              <span className="text-xs text-muted-foreground ml-1">
                Max for {experienceBracket.label}
              </span>
            </Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max={maxAllowedRating}
              step="0.1"
              value={ratingValue}
              onChange={(e) => setRatingValue(e.target.value)}
              placeholder={maxAllowedRating.toString()}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Rating Notes</Label>
          <Textarea
            id="notes"
            value={ratingNotes}
            onChange={(e) => setRatingNotes(e.target.value)}
            placeholder="Internal notes about this rating..."
            className="min-h-[80px] resize-none"
          />
        </div>

        <Button type="submit" disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Rating'}
        </Button>
      </form>

      {/* Current Ratings */}
      {ratings.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Current Platform Ratings</h4>
          <div className="space-y-2">
            {ratings.map((rating) => (
              <div
                key={rating.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {RATING_CATEGORIES.find(c => c.value === rating.rating_category)?.label}
                    </span>
                    <span className="text-lg font-bold text-accent">
                      {rating.rating.toFixed(1)}
                    </span>
                  </div>
                  {rating.rating_notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {rating.rating_notes}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(rating.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};