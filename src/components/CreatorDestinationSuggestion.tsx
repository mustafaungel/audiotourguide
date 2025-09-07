import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COUNTRIES } from '@/data/constants';

const CATEGORIES = [
  'cultural', 'historical', 'nature', 'adventure', 'food', 'art', 
  'religious', 'architecture', 'entertainment', 'shopping'
];

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

interface CreatorDestinationSuggestionProps {
  onSuccess?: () => void;
}

export const CreatorDestinationSuggestion = ({ onSuccess }: CreatorDestinationSuggestionProps) => {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    description: '',
    category: 'cultural',
    latitude: '',
    longitude: '',
    best_time_to_visit: '',
    difficulty_level: 'beginner',
    popular_attractions: '',
    cultural_significance: '',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const { toast } = useToast();

  const generateDescription = async () => {
    if (!formData.name || !formData.country || !formData.city) {
      toast({
        title: "Missing Information",
        description: "Please fill in name, country, and city before generating description",
        variant: "destructive",
      });
      return;
    }

    setGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: {
          type: 'destination',
          data: {
            name: formData.name,
            country: formData.country,
            city: formData.city,
            category: formData.category
          }
        }
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        description: data.description
      }));

      toast({
        title: "Success",
        description: "Description generated successfully!",
      });
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: "Error",
        description: "Failed to generate description",
        variant: "destructive",
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const destinationData = {
        name: formData.name,
        country: formData.country,
        city: formData.city,
        description: formData.description,
        category: formData.category,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        best_time_to_visit: formData.best_time_to_visit,
        difficulty_level: formData.difficulty_level,
        popular_attractions: formData.popular_attractions.split(',').map(item => item.trim()).filter(Boolean),
        cultural_significance: formData.cultural_significance,
        image_url: formData.image_url,
        is_approved: false // Creator suggestions need approval
      };

      const { error } = await supabase
        .from('destinations')
        .insert([destinationData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Destination suggestion submitted! It will be reviewed by our team.",
      });

      // Reset form
      setFormData({
        name: '',
        country: '',
        city: '',
        description: '',
        category: 'cultural',
        latitude: '',
        longitude: '',
        best_time_to_visit: '',
        difficulty_level: 'beginner',
        popular_attractions: '',
        cultural_significance: '',
        image_url: ''
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting destination suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to submit destination suggestion",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggest New Destination</CardTitle>
        <p className="text-sm text-muted-foreground">
          Help expand our destination database by suggesting new places for travelers to explore.
          Your suggestions will be reviewed by our team before being approved.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Destination Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., Eiffel Tower"
              />
            </div>

            <div>
              <Label htmlFor="country">Country *</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                required
                placeholder="e.g., Paris"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="latitude">Latitude (optional)</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                placeholder="e.g., 48.8584"
              />
            </div>

            <div>
              <Label htmlFor="longitude">Longitude (optional)</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                placeholder="e.g., 2.2945"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="description">Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateDescription}
                disabled={generatingDescription}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {generatingDescription ? 'Generating...' : 'AI Generate'}
              </Button>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="Describe what makes this destination special..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="best_time">Best Time to Visit</Label>
              <Input
                id="best_time"
                value={formData.best_time_to_visit}
                onChange={(e) => setFormData(prev => ({ ...prev, best_time_to_visit: e.target.value }))}
                placeholder="e.g., Spring (March-May)"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="attractions">Popular Attractions (comma-separated)</Label>
            <Input
              id="attractions"
              value={formData.popular_attractions}
              onChange={(e) => setFormData(prev => ({ ...prev, popular_attractions: e.target.value }))}
              placeholder="e.g., Observation deck, Restaurant, Museum"
            />
          </div>

          <div>
            <Label htmlFor="cultural">Cultural Significance</Label>
            <Textarea
              id="cultural"
              value={formData.cultural_significance}
              onChange={(e) => setFormData(prev => ({ ...prev, cultural_significance: e.target.value }))}
              rows={3}
              placeholder="What cultural or historical importance does this destination have?"
            />
          </div>

          <div>
            <Label htmlFor="image">Image URL (optional)</Label>
            <Input
              id="image"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Destination Suggestion'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};