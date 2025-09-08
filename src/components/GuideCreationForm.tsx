import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { InputWithCounter } from "@/components/ui/character-counter";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, X, Plus, Image as ImageIcon } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

interface GuideCreationFormProps {
  onSubmit: (data: GuideFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export interface GuideFormData {
  title: string;
  description: string;
  destination_id: string;
  category: string;
  difficulty: string;
  price: number;
  duration: number;
  languages: string[];
  bestTime: string;
  image_urls: string[];
}

interface Destination {
  id: string;
  name: string;
  city: string;
  country: string;
}

const CATEGORIES = [
  'Historical Sites',
  'Museums & Galleries', 
  'Cultural Tours',
  'Nature & Wildlife',
  'Food & Cuisine',
  'Architecture',
  'Religious Sites',
  'Local Markets',
  'Street Art',
  'Neighborhoods'
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy - All ages welcome' },
  { value: 'moderate', label: 'Moderate - Some walking required' },
  { value: 'challenging', label: 'Challenging - Good fitness needed' }
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Dutch', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic',
  'Hindi', 'Turkish', 'Greek', 'Swedish', 'Norwegian', 'Danish'
];

export const GuideCreationForm: React.FC<GuideCreationFormProps> = ({
  onSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<GuideFormData>({
    title: "",
    description: "",
    destination_id: "",
    category: "",
    difficulty: "",
    price: 0,
    duration: 0,
    languages: ['English'],
    bestTime: "",
    image_urls: [],
  });
  const [newLanguage, setNewLanguage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  // Fetch destinations on component mount
  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('id, name, city, country')
        .eq('is_approved', true)
        .order('name');

      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      toast.error('Failed to load destinations');
    } finally {
      setLoadingDestinations(false);
    }
  };

  const generateDescription = async () => {
    if (!formData.destination_id || !formData.title || !formData.category) {
      toast.error('Please select destination, enter title, and choose category before generating description');
      return;
    }

    const selectedDestination = destinations.find(d => d.id === formData.destination_id);
    if (!selectedDestination) {
      toast.error('Please select a valid destination');
      return;
    }

    setGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: {
          type: 'guide',
          data: {
            title: formData.title,
            destination: selectedDestination,
            category: formData.category,
            duration: formData.duration,
            audience: 'general travelers'
          }
        }
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        description: data.description
      }));

      toast.success('Description generated successfully!');
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    } else if (formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    if (!formData.destination_id) {
      newErrors.destination_id = "Destination is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.difficulty) {
      newErrors.difficulty = "Difficulty is required";
    }

    if (formData.price < 1) {
      newErrors.price = "Price must be at least $1";
    }

    if (formData.duration < 5) {
      newErrors.duration = "Duration must be at least 5 minutes";
    }

    if (formData.languages.length === 0) {
      newErrors.languages = "At least one language must be selected";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the validation errors");
      return;
    }

    // Submit the form
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("Failed to create guide");
    }
  };

  const addLanguage = () => {
    if (newLanguage && !formData.languages.includes(newLanguage)) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    if (language !== 'English') { // Keep English as default
      setFormData(prev => ({
        ...prev,
        languages: prev.languages.filter(l => l !== language)
      }));
    }
  };

  return (
    <Card className="mobile-container mobile-card">
      <CardHeader>
        <CardTitle className="mobile-heading">Create New Audio Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="mobile-spacing">{/* Mobile-first form */}
          <div className="mobile-grid gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title" className="mobile-caption font-medium">Guide Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter an engaging title for your guide"
                className={`touch-target mobile-text ${errors.title ? "border-red-500" : ""}`}
              />
              {errors.title && <p className="text-red-500 mobile-caption mt-1">{errors.title}</p>}
            </div>

            {/* Destination */}
            <div>
              <Label htmlFor="destination" className="mobile-caption font-medium">Destination *</Label>
              <Select
                value={formData.destination_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, destination_id: value }))}
              >
                <SelectTrigger className={`touch-target ${errors.destination_id ? "border-red-500" : ""}`}>
                  <SelectValue placeholder={loadingDestinations ? "Loading destinations..." : "Select destination"} />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((destination) => (
                    <SelectItem key={destination.id} value={destination.id}>
                      {destination.name} - {destination.city}, {destination.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.destination_id && <p className="text-red-500 mobile-caption mt-1">{errors.destination_id}</p>}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category" className="mobile-caption font-medium">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className={`touch-target ${errors.category ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 mobile-caption mt-1">{errors.category}</p>}
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price">Price (USD) *</Label>
              <Input
                id="price"
                type="number"
                min="1"
                max="999"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="9.99"
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: $3-15 for most guides
              </p>
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                max="180"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                placeholder="45"
                className={errors.duration ? "border-red-500" : ""}
              />
              {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Typical guides are 30-60 minutes
              </p>
            </div>

            {/* Difficulty */}
            <div className="md:col-span-2">
              <Label htmlFor="difficulty">Difficulty Level *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger className={errors.difficulty ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((diff) => (
                    <SelectItem key={diff.value} value={diff.value}>
                      {diff.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.difficulty && <p className="text-red-500 text-sm mt-1">{errors.difficulty}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="description">Description *</Label>
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
              placeholder="Describe what travelers will experience and learn..."
              className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
              <span className="text-sm text-gray-500 ml-auto">
                {formData.description.length}/1000 characters
              </span>
            </div>
          </div>

          {/* Languages */}
          <div>
            <Label htmlFor="languages">Languages Available</Label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((language) => (
                  <Badge
                    key={language}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    {language}
                    {language !== 'English' && (
                      <button
                        type="button"
                        onClick={() => removeLanguage(language)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Select value={newLanguage} onValueChange={setNewLanguage}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.filter(lang => !formData.languages.includes(lang)).map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLanguage}
                  disabled={!newLanguage}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {errors.languages && <p className="text-red-500 text-sm mt-1">{errors.languages}</p>}
            </div>
          </div>

          {/* Images */}
          <div>
            <Label>Guide Images</Label>
            <ImageUploader
              onImagesUploaded={(urls) => setFormData(prev => ({ ...prev, image_urls: urls }))}
              currentImages={formData.image_urls}
              maxImages={5}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload images to showcase your guide. The first image will be the primary image.
            </p>
          </div>

          {/* Best Time to Visit */}
          <div>
            <Label htmlFor="bestTime">Best Time to Visit (Optional)</Label>
            <Textarea
              id="bestTime"
              value={formData.bestTime}
              onChange={(e) => setFormData(prev => ({ ...prev, bestTime: e.target.value }))}
              placeholder="When is the best time to experience this location?"
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Share seasonal tips or optimal visiting times
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full mobile-button touch-target"
            size="lg"
          >
            {isSubmitting ? 'Creating Guide...' : 'Create Audio Guide'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};